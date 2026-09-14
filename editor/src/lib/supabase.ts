import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Diagnostic-only logger so we can still see what supabase is doing
// in production DevTools. NO custom lock, NO focus handlers, and the
// only fetch wrapping is the auth deadline below — nothing that retries,
// re-orders, or holds state. We learned the hard way that each layer of
// "helpful" wrapping was a new source of races, leaked navigator-locks,
// and stuck state; a plain deadline is the one thing that fixes the
// stuck state instead of adding to it.
const T0 = Date.now()
const t = () => `${((Date.now() - T0) / 1000).toFixed(1)}s`
const dbg = (...args: unknown[]) => console.log('[mortals]', t(), ...args)

/**
 * fetch with a deadline, applied ONLY to Supabase Auth calls.
 *
 * This is the actual fix for "the panel never loads until I refresh".
 * supabase-js serialises auth work behind one lock and, while a locked
 * operation runs, flags the client as `lockAcquired`. Every later
 * getSession() then queues behind that operation *inside the client*
 * (see GoTrueClient._acquireLock) — it never touches the Web Locks API
 * at all. supabase-js's own fetch has no timeout, so the moment one token
 * refresh to /auth/v1/token stalls on a flaky connection, that flag stays
 * set forever and every query in the tab waits on a promise that will
 * never settle. Stealing the Web Lock does nothing for this — the lock is
 * already free — which is why the earlier steal-on-demand and watchdog
 * approaches failed while the lock sat idle.
 *
 * Bounding the auth request makes the stalled operation *fail* instead of
 * hang, its finally block clears the flag, and the queue drains. A
 * failed refresh is retried by supabase-js on its own schedule.
 *
 * Scoped to /auth/v1/ on purpose: PostgREST reads are bounded by
 * runQuery, and Storage uploads of large images legitimately take longer
 * than any sane auth deadline.
 */
export const AUTH_FETCH_TIMEOUT_MS = 12_000

const fetchWithAuthTimeout: typeof fetch = (input, init) => {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!target.includes('/auth/v1/')) return fetch(input, init)
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(new DOMException('auth request timed out', 'TimeoutError')), AUTH_FETCH_TIMEOUT_MS)
  // Honour a caller-supplied signal too.
  init?.signal?.addEventListener('abort', () => ctl.abort(init.signal?.reason), { once: true })
  return fetch(input, { ...init, signal: ctl.signal }).finally(() => clearTimeout(timer))
}

// supabase-js persists the session under this key. Set explicitly so the
// data client below can read exactly what the auth client writes, rather
// than both quietly depending on the library's default naming.
const projectRef = url?.match(/https:\/\/([a-z0-9]+)\./)?.[1] ?? 'supabase'
export const AUTH_STORAGE_KEY = `sb-${projectRef}-auth-token`

/**
 * The persisted session, read straight from storage.
 *
 * This deliberately bypasses `auth.getSession()`. That call is serialised
 * behind supabase-js's internal auth queue, and a stalled token refresh
 * wedges that queue (see fetchWithAuthTimeout above). Storage is written
 * by the auth client on every sign-in and refresh, so it is always the
 * most recent good session — and reading it can never block.
 */
export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

/**
 * Two clients, on purpose.
 *
 * `supabaseAuth` owns sign-in, sign-out, password reset, token refresh,
 * persistence and auth events. It is the only thing that touches the
 * auth queue.
 *
 * `supabase` is for data — PostgREST and Storage. Configured with
 * `accessToken`, it takes its bearer token from storage per request and
 * never calls `auth.getSession()`, so a panel read cannot be held hostage
 * by a refresh that is stuck. (supabase-js makes `supabase.auth.*` throw
 * on a client configured this way; every auth call goes via supabaseAuth.)
 */
export const supabaseAuth = createClient(url, anonKey, {
  global: { fetch: fetchWithAuthTimeout },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: AUTH_STORAGE_KEY,
  },
})

export const supabase = createClient(url, anonKey, {
  accessToken: async () => readStoredSession()?.access_token ?? null,
})

supabaseAuth.auth.onAuthStateChange((event, session) => {
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
