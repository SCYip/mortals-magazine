import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Diagnostic-only logger so we can still see what supabase is doing
// in production DevTools. NO fetch interception, NO custom lock,
// NO focus handlers — supabase-js manages all of that itself. We
// learned the hard way that each layer of "helpful" wrapping was a
// new source of races, leaked navigator-locks, and stuck state.
const T0 = Date.now()
const t = () => `${((Date.now() - T0) / 1000).toFixed(1)}s`
const dbg = (...args: unknown[]) => console.log('[mortals]', t(), ...args)

// One-shot safety net: if there's already a navigator-lock held for
// our Supabase auth-token key at module load, it can only be from a
// previous tab/bundle that crashed or never released. Steal it so
// supabase-js can acquire it fresh. This runs BEFORE createClient
// below — no re-entry into supabase-js's own lock management, so it
// can't cause the leak it's trying to clear.
const projectRef = url?.match(/https:\/\/([a-z0-9]+)\./)?.[1]
const lockName = projectRef ? `lock:sb-${projectRef}-auth-token` : null
if (lockName && typeof navigator !== 'undefined' && navigator.locks?.request) {
  ;(async () => {
    try {
      const available = await navigator.locks.request<boolean>(
        lockName,
        { ifAvailable: true },
        (lock) => lock !== null,
      )
      if (available === false) {
        console.warn('[mortals] stale auth lock detected at module load — stealing')
        await navigator.locks.request(lockName, { steal: true }, async () => undefined)
      }
    } catch (err: any) {
      console.warn('[mortals] lock-cleanup failed:', err?.message ?? err)
    }
  })()
}

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
