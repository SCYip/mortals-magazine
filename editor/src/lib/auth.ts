import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase, unstickAuthLock } from './supabase'

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
    // Bootstrap the session, but never let it hang. getSession() waits on
    // a navigator lock; if another tab is holding that lock and has gone
    // to sleep, this promise never settles and the app sits on "Loading…"
    // until someone reloads. Give it a few seconds, then steal the lock
    // and try once more; if it still won't settle, fall through to the
    // login screen rather than an infinite spinner.
    const BOOT_TIMEOUT_MS = 6000
    const withTimeout = <T,>(p: Promise<T>) => new Promise<T>((res, rej) => {
      const t = setTimeout(() => rej(new Error('getSession timed out')), BOOT_TIMEOUT_MS)
      p.then(v => { clearTimeout(t); res(v) }, e => { clearTimeout(t); rej(e) })
    })
    ;(async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession())
        apply(data.session)
      } catch (err: any) {
        console.warn('[auth] getSession failed:', err?.message ?? err)
        const stole = await unstickAuthLock('auth bootstrap timed out')
        if (!stole) { apply(null); return }
        try {
          const { data } = await withTimeout(supabase.auth.getSession())
          apply(data.session)
        } catch (err2: any) {
          console.warn('[auth] getSession failed after unstick:', err2?.message ?? err2)
          apply(null)
        }
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  const signOut = async () => {
    await supabase.auth.signOut()
    // Full reload to /login. Clears any panel-level component state
    // (rows, loading flags, etc.) so the next sign-in starts clean.
    window.location.href = '/login'
  }
  const resetPassword = async (email: string) => {
    // The link Supabase emails must land somewhere that can finish the
    // flow, and that origin has to be on the project's redirect allow-list
    // (Auth → URL Configuration) or Supabase silently falls back to the
    // Site URL instead.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
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
