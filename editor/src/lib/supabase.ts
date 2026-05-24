import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail loudly in the editor — it cannot work without Supabase
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

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
let lockChain: Promise<unknown> = Promise.resolve()
const memoryLock = <R,>(_name: string, _timeoutMs: number, fn: () => Promise<R>): Promise<R> => {
  const next = lockChain.then(() => fn())
  // Swallow errors on the chain itself so one failed refresh doesn't
  // poison every subsequent acquisition. Callers still see the rejection.
  lockChain = next.catch(() => undefined)
  return next as Promise<R>
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: memoryLock,
  },
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
