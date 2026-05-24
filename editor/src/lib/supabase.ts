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

// Wrap every Supabase request in a 15-second abort timeout AND log
// timing/status. This is the single biggest fix for the recurring
// "content stops loading" symptom — when cross-border traffic from
// China to Supabase stalls, the browser's default fetch has no
// timeout and the UI sits in `loading=true` forever. Aborting at 15s
// guarantees the call rejects, panels flip `loading=false`, and the
// user can retry.
const FETCH_TIMEOUT_MS = 15_000
const origFetch = window.fetch.bind(window)
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const reqUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (!reqUrl.includes('supabase.co')) return origFetch(input, init)
  const path = reqUrl.replace(/^https?:\/\/[^/]+/, '').slice(0, 80)
  const start = Date.now()
  dbg('fetch.start', path)
  // Combine any caller-supplied signal with our timeout signal so we
  // don't clobber existing aborts (supabase-js sometimes passes its
  // own AbortSignal).
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('fetch-timeout')), FETCH_TIMEOUT_MS)
  const callerSignal = init?.signal
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort(callerSignal.reason)
    else callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason), { once: true })
  }
  return origFetch(input, { ...init, signal: controller.signal }).then(
    r => { clearTimeout(timer); dbg('fetch.done', path, r.status, `${Date.now() - start}ms`); return r },
    e => {
      clearTimeout(timer)
      const ms = Date.now() - start
      const msg = String(e?.message ?? e).slice(0, 200)
      dbg('fetch.fail', path, `${ms}ms`, msg)
      throw e
    },
  )
}) as typeof window.fetch

window.addEventListener('error', e => dbg('window.error', String(e.message).slice(0, 200)))
window.addEventListener('unhandledrejection', e => dbg('window.rejection', String(e.reason?.message ?? e.reason).slice(0, 200)))

// Use supabase-js's default lock (navigator.locks via AbortController).
// We don't need a custom lock anymore — the only failure mode we
// actually need to handle (a leaked lock from a previous tab) is
// dealt with by the steal-at-startup block above.
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
