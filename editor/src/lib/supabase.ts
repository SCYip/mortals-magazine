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

/**
 * If the auth-token lock is held right now, steal it.
 *
 * A stuck lock makes `supabase.auth.getSession()` wait forever, which
 * shows up as a panel that never finishes loading — and the only thing
 * that used to fix it was a page reload, because this check ran at
 * module load. It's now callable so query.ts can run the same recovery
 * on demand when getSession() times out, without the reload.
 *
 * Returns true if a lock was actually stolen.
 */
export async function unstickAuthLock(reason = 'on demand'): Promise<boolean> {
  if (!lockName || typeof navigator === 'undefined' || !navigator.locks?.request) return false
  try {
    const available = await navigator.locks.request<boolean>(
      lockName,
      { ifAvailable: true },
      (lock) => lock !== null,
    )
    if (available === false) {
      console.warn(`[mortals] stale auth lock detected (${reason}) — stealing`)
      await navigator.locks.request(lockName, { steal: true }, async () => undefined)
      return true
    }
  } catch (err: any) {
    console.warn('[mortals] lock-cleanup failed:', err?.message ?? err)
  }
  return false
}
void unstickAuthLock('module load')

/**
 * Watchdog for the stuck-lock failure mode.
 *
 * The recovery above only runs at module load, which is why "refresh the
 * page" was the only fix. This polls navigator.locks and, if the auth lock
 * has been held by a *different* client (another tab) for two consecutive
 * checks (~6s+), steals it. A healthy token refresh holds the lock for well
 * under two seconds, so this only ever fires on a tab that has frozen mid-
 * refresh — and stealing from that tab just makes its refresh retry.
 *
 * Deliberately not a custom `lock` implementation handed to supabase-js:
 * that was tried before and leaked. This only observes and steals from
 * the outside.
 */
function startAuthLockWatchdog() {
  if (!lockName || typeof navigator === 'undefined' || !navigator.locks?.query) return
  let myClientId: string | null = null
  let stuckHolder: string | null = null
  let stuckSince = 0
  const HOLD_LIMIT_MS = 6000
  const POLL_MS = 3000

  // Learn our own clientId by briefly holding a throwaway lock.
  navigator.locks.request(`${lockName}:probe`, async () => {
    const q = await navigator.locks.query()
    myClientId = (q.held ?? []).find(l => l.name === `${lockName}:probe`)?.clientId ?? null
  }).catch(() => {})

  setInterval(async () => {
    try {
      const q = await navigator.locks.query()
      const held = (q.held ?? []).find(l => l.name === lockName)
      const waiting = (q.pending ?? []).some(l => l.name === lockName)
      if (!held || held.clientId === myClientId || !waiting) {
        stuckHolder = null
        return
      }
      if (stuckHolder !== held.clientId) {
        stuckHolder = held.clientId ?? null
        stuckSince = Date.now()
        return
      }
      if (Date.now() - stuckSince >= HOLD_LIMIT_MS) {
        console.warn('[mortals] auth lock held by another tab for', Date.now() - stuckSince, 'ms with requests waiting — stealing')
        await navigator.locks.request(lockName, { steal: true }, async () => undefined)
        stuckHolder = null
      }
    } catch { /* query() can throw in odd contexts; just try again next tick */ }
  }, POLL_MS)
}
startAuthLockWatchdog()

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
