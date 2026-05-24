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

// Wrap navigator.locks with a "steal after timeout" escape hatch.
//
// Background: supabase-js's default lock uses navigator.locks. That's
// the right answer for cross-tab refresh coordination, except a lock
// that was held by a previous tab which crashed (or was closed mid-
// refresh) stays held forever and blocks every subsequent getSession()
// in this tab.
//
// Earlier we tried a no-op and then a promise-chain mutex, but both
// create *worse* races: any piggybacked operation (SIGNED_OUT
// listeners, useRole's getSession, ArticlesPanel's access-token
// lookup) keeps the outer lock callback alive and the chain stalls.
//
// This version requests the lock with a short timeout. If we can't
// get it, we use `steal: true` to break the dead lock — that's
// exactly what the Lock API gives us for this scenario.
let lockSeq = 0
const navigatorLock = async <R,>(name: string, _timeoutMs: number, fn: () => Promise<R>): Promise<R> => {
  const id = ++lockSeq
  dbg('lock.acquire', id, name)
  const releaseOk = (v: R): R => { dbg('lock.release.ok', id); return v }
  const releaseErr = (label: string, e: unknown): never => {
    dbg('lock.release.err.' + label, id, String((e as Error)?.message ?? e).slice(0, 200))
    throw e
  }
  // First attempt: normal wait (5s) — long enough for legitimate
  // overlaps, short enough that a leaked lock doesn't stall the UI.
  try {
    return await Promise.race([
      navigator.locks.request(name, { mode: 'exclusive' }, async () => {
        try { return releaseOk(await fn()) }
        catch (e) { return releaseErr('normal', e) }
      }) as Promise<R>,
      new Promise<R>((_, reject) => setTimeout(() => reject(new Error('lock-timeout')), 5000)),
    ])
  } catch (e: any) {
    if (e?.message !== 'lock-timeout') throw e
    dbg('lock.steal', id, name)
    // Second attempt: steal — breaks any dead lock left by a crashed tab.
    return await (navigator.locks.request(name, { mode: 'exclusive', steal: true }, async () => {
      try { return releaseOk(await fn()) }
      catch (e2) { return releaseErr('after-steal', e2) }
    }) as Promise<R>)
  }
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
    lock: navigatorLock,
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
