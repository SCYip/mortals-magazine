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

// In-memory mutex used in place of supabase-js's default navigator.locks.
// Two goals:
//   1. Never touch navigator.locks. We've been bitten by leaked locks from
//      a previous tab that died without releasing — every getSession() then
//      hangs forever.
//   2. Still serialize concurrent refreshes. supabase-js fires an
//      autoRefreshTick every 10 seconds, and if that races with one of our
//      data fetches both can read/write the persisted token at the same
//      time and corrupt it (symptom: content stops loading ~10 s after
//      page load). A simple promise chain forces sequential execution.
//
// Each acquire/release is also logged so a stuck-forever chain is
// observable in production.
let lockChain: Promise<unknown> = Promise.resolve()
let lockSeq = 0
const memoryLock = <R,>(name: string, _timeoutMs: number, fn: () => Promise<R>): Promise<R> => {
  const id = ++lockSeq
  dbg('lock.acquire', id, name)
  const next = lockChain.then(() => fn()).then(
    v => { dbg('lock.release.ok', id); return v },
    e => { dbg('lock.release.err', id, String(e?.message ?? e).slice(0, 200)); throw e },
  )
  lockChain = next.catch(() => undefined)
  return next as Promise<R>
}

// Wrap fetch to time every Supabase REST/Auth call. This is the single
// best diagnostic when "content stops loading" — we see which request
// hangs or returns a non-2xx response.
const origFetch = window.fetch.bind(window)
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const reqUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (!reqUrl.includes('supabase.co')) return origFetch(input, init)
  const path = reqUrl.replace(/^https?:\/\/[^/]+/, '').slice(0, 80)
  const start = Date.now()
  dbg('fetch.start', path)
  return origFetch(input, init).then(
    r => { dbg('fetch.done', path, r.status, `${Date.now() - start}ms`); return r },
    e => { dbg('fetch.fail', path, `${Date.now() - start}ms`, String(e?.message ?? e).slice(0, 200)); throw e },
  )
}) as typeof window.fetch

window.addEventListener('error', e => dbg('window.error', String(e.message).slice(0, 200)))
window.addEventListener('unhandledrejection', e => dbg('window.rejection', String(e.reason?.message ?? e.reason).slice(0, 200)))

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: memoryLock,
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
