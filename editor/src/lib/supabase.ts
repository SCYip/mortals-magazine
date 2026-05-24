import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail loudly in the editor — it cannot work without Supabase
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

const T0 = Date.now()
const t = () => `${((Date.now() - T0) / 1000).toFixed(1)}s`
const dbg = (...args: unknown[]) => console.log('[mortals]', t(), ...args)

// Clear a leaked navigator-lock from a previous tab.
//
// supabase-js uses navigator.locks (key: `lock:sb-<ref>-auth-token`)
// to serialize cross-tab refreshes. If the previous tab crashed or
// closed mid-refresh, the lock can be left held — every future
// getSession() in this tab then waits forever. The Lock API gives us
// `steal: true` for exactly this case.
//
// At module load, NOTHING legitimate could be holding our lock (we
// haven't initialized the auth client yet), so if it's not available,
// it's leaked and safe to steal.
const projectRef = url?.match(/https:\/\/([a-z0-9]+)\./)?.[1]
const lockName = projectRef ? `lock:sb-${projectRef}-auth-token` : null
if (lockName && typeof navigator !== 'undefined' && navigator.locks) {
  ;(async () => {
    try {
      const available = await navigator.locks.request<boolean>(
        lockName,
        { ifAvailable: true },
        (lock) => lock !== null,
      )
      if (available === false) {
        console.warn('[mortals] stale auth lock detected — stealing')
        await navigator.locks.request(lockName, { steal: true }, async () => undefined)
      }
    } catch (err: any) {
      console.warn('[mortals] lock-cleanup failed:', err?.message ?? err)
    }
  })()
}

// Root-cause fix for "content stops loading after I switch to WeChat
// and back": when the user app-switches (Chrome window loses focus
// but the tab itself stays "visible" in Chrome terms),
// supabase-js's `_onVisibilityChanged` does NOT fire — that handler
// only listens to `document.visibilitychange`, which is a tab-level
// event. So the auto-refresh-on-recovery flow that would normally
// refresh an expiring access_token never runs, and the next REST
// call goes out with an expired token. Supabase responds 401.
// supabase-js does not auto-retry on 401, so the panel sees
// `{ data: null, error: 401 }` and shows the empty/error state.
//
// This file solves it three ways, in order of preference:
//
//   1. Proactive refresh on window focus. When the Chrome window
//      regains focus (which fires `window.focus` even on app-switch),
//      we check the stored session and call refreshSession() if it's
//      within 60 s of expiry. The next REST call will use the fresh
//      token.
//
//   2. 401-retry in the fetch wrapper. If a Supabase REST/Storage
//      response comes back 401 anyway (race: token expired between
//      our check and the request), refresh the session once and
//      retry the request with the new Authorization header.
//
//   3. Same 15 s abort timeout on REST as before, so a stalled
//      cross-border connection still rejects cleanly.
//
// Auth endpoints (/auth/v1/...) skip both the timeout and the
// 401-retry — aborting an in-flight refresh leaves the client in a
// half-state, and retrying a refresh is pointless.

const FETCH_TIMEOUT_MS = 15_000
const REFRESH_MARGIN_SEC = 60
const origFetch = window.fetch.bind(window)

// Coalesce concurrent refresh attempts (multiple fetches hitting 401
// at the same time should share one refresh round-trip).
let refreshInFlight: Promise<string | null> | null = null
function refreshNow(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) { dbg('refresh.fail', error.message); return null }
      dbg('refresh.ok', data.session ? `exp=${data.session.expires_at}` : 'no-session')
      return data.session?.access_token ?? null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

async function getCurrentAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch { return null }
}

window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const reqUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (!reqUrl.includes('supabase.co')) return origFetch(input, init)

  const path = reqUrl.replace(/^https?:\/\/[^/]+/, '').slice(0, 80)
  const start = Date.now()
  dbg('fetch.start', path)
  const isAuth = path.startsWith('/auth/')

  // Combine our 15 s timeout with any caller-supplied AbortSignal.
  const makeController = () => {
    const controller = new AbortController()
    const timer = isAuth ? null : setTimeout(() => controller.abort(new Error('fetch-timeout')), FETCH_TIMEOUT_MS)
    const callerSignal = init?.signal
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort(callerSignal.reason)
      else callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason), { once: true })
    }
    return { signal: controller.signal, clear: () => { if (timer) clearTimeout(timer) } }
  }

  // First attempt.
  let resp: Response
  const { signal, clear } = makeController()
  try {
    resp = await origFetch(input, { ...init, signal })
    clear()
    dbg('fetch.done', path, resp.status, `${Date.now() - start}ms`)
  } catch (e: any) {
    clear()
    dbg('fetch.fail', path, `${Date.now() - start}ms`, String(e?.message ?? e).slice(0, 200))
    throw e
  }

  // If a REST/Storage call returns 401, the token is stale. Refresh
  // and retry once with the new token. Auth endpoints don't retry.
  if (resp.status !== 401 || isAuth) return resp
  dbg('fetch.401-retry', path)
  const fresh = await refreshNow()
  if (!fresh) return resp // give the original 401 back

  // Patch the Authorization header for the retry.
  const newHeaders = new Headers(init?.headers)
  newHeaders.set('Authorization', `Bearer ${fresh}`)
  const { signal: signal2, clear: clear2 } = makeController()
  try {
    const retry = await origFetch(input, { ...init, headers: newHeaders, signal: signal2 })
    clear2()
    dbg('fetch.done.retry', path, retry.status, `${Date.now() - start}ms`)
    return retry
  } catch (e: any) {
    clear2()
    dbg('fetch.fail.retry', path, `${Date.now() - start}ms`, String(e?.message ?? e).slice(0, 200))
    throw e
  }
}) as typeof window.fetch

window.addEventListener('error', e => dbg('window.error', String(e.message).slice(0, 200)))
window.addEventListener('unhandledrejection', e => dbg('window.rejection', String(e.reason?.message ?? e.reason).slice(0, 200)))

// Use supabase-js's default lock (navigator.locks via AbortController).
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

supabase.auth.onAuthStateChange((event, session) => {
  dbg('auth.state', event, session ? `user=${session.user.email}` : 'no-session', session ? `exp=${session.expires_at}` : '')
})

// Proactive refresh on focus / visibility-change. supabase-js handles
// `visibilitychange` itself, but only fires recovery on that event —
// not on `window.focus`. The latter is what fires when you alt-tab
// back from WeChat / Messages / another app. Without this, the
// access_token can expire while you're in the other app and the
// next REST call gets a 401.
async function refreshIfStale() {
  try {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (!session?.expires_at) return
    const expiresInSec = session.expires_at - Math.floor(Date.now() / 1000)
    if (expiresInSec < REFRESH_MARGIN_SEC) {
      dbg('focus.refresh-needed', `expiresInSec=${expiresInSec}`)
      await refreshNow()
    }
  } catch (err: any) {
    dbg('focus.check-failed', String(err?.message ?? err).slice(0, 120))
  }
}
window.addEventListener('focus', refreshIfStale)
// Also catch the case where stored session was already expired at
// module load (e.g. user left the tab open overnight, comes back).
if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
  setTimeout(refreshIfStale, 100)
}

export const BUCKETS = {
  article: 'article-covers',
  volume: 'volume-covers',
  hero: 'hero-slides',
  alumni: 'alumni-portraits',
} as const

/** Upload a file to a bucket and return the public URL. */
export async function uploadImage(bucket: keyof typeof BUCKETS, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKETS[bucket]).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(path)
  return data.publicUrl
}
