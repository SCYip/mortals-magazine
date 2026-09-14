import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabaseAuth, readStoredSession, AUTH_FETCH_TIMEOUT_MS } from './supabase'

// Single source of truth for the auth session — one Provider at the
// app root, every other component reads via useAuth().
type AuthState = {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Email a password-recovery link that lands on /reset-password. */
  resetPassword: (email: string) => Promise<void>
  /** Set a new password for the currently signed-in (recovery) session. */
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const apply = (s: Session | null) => {
      if (cancelled) return
      setSession(s)
      setLoading(false)
    }
    // Bootstrap the session, but never let it hang. If a token refresh is
    // stalled, getSession() queues behind it inside supabase-js; the auth
    // fetch deadline in supabase.ts aborts that refresh, after which this
    // settles. Wait a little longer than that deadline, then fall through
    // to the login screen rather than an infinite spinner.
    const BOOT_TIMEOUT_MS = AUTH_FETCH_TIMEOUT_MS + 3000
    const withTimeout = <T,>(p: Promise<T>) => new Promise<T>((res, rej) => {
      const t = setTimeout(() => rej(new Error('getSession timed out')), BOOT_TIMEOUT_MS)
      p.then(v => { clearTimeout(t); res(v) }, e => { clearTimeout(t); rej(e) })
    })
    withTimeout(supabaseAuth.auth.getSession())
      .then(({ data }) => apply(data.session))
      .catch(err => {
        // The queue is wedged. Storage still holds the last good session;
        // if it hasn't expired, use it rather than bouncing to /login —
        // the data client reads from storage anyway, so the app works.
        const stored = readStoredSession()
        const alive = stored && (stored.expires_at ?? 0) > Math.floor(Date.now() / 1000)
        console.warn('[auth] getSession failed:', err?.message ?? err, alive ? '— using stored session' : '— no usable stored session')
        apply(alive ? stored : null)
      })
    const { data: sub } = supabaseAuth.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return
      setSession(s)
      setLoading(false)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseAuth.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  const signOut = async () => {
    await supabaseAuth.auth.signOut()
    // Full reload to /login. Clears any panel-level component state
    // (rows, loading flags, etc.) so the next sign-in starts clean.
    window.location.href = '/login'
  }
  const resetPassword = async (email: string) => {
    // The link Supabase emails must land somewhere that can finish the
    // flow, and that origin has to be on the project's redirect allow-list
    // (Auth → URL Configuration) or Supabase silently falls back to the
    // Site URL instead.
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }
  const updatePassword = async (password: string) => {
    const { error } = await supabaseAuth.auth.updateUser({ password })
    if (error) throw error
  }

  const value: AuthState = { session, loading, signIn, signOut, resetPassword, updatePassword }
  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>')
  }
  return ctx
}
