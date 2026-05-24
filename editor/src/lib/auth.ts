import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Single source of truth for the auth session — owned by one provider
// at the app root. Avoids the race where LoginPage and Protected each
// own a separate `useAuth` instance: LoginPage gets SIGNED_IN, navigates
// to /articles, Protected mounts a *fresh* hook with `session=null`,
// and the 4-second safety timer flips `loading` to false before the
// queued getSession() resolves — Protected then redirects back to
// /login while the real session sits valid in storage.
type AuthState = {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
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
    // Belt: getSession() should resolve fast, but supabase-js can hang
    // when a token is mid-refresh. Catch + finally guarantees loading
    // never sticks true on this branch.
    supabase.auth.getSession()
      .then(({ data }) => apply(data.session))
      .catch(err => {
        console.warn('[auth] getSession failed:', err?.message ?? err)
        apply(null)
      })
    // Suspenders: even if the promise above never settles, give up
    // after 4 seconds and let the UI render. The auth-state listener
    // below will fix things once a real event arrives.
    const safetyTimer = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 4000)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return
      setSession(s)
      setLoading(false)
    })
    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  const signOut = async () => {
    await supabase.auth.signOut()
    // Full reload to /login. Otherwise the React tree keeps the
    // panel-level component state (rows, loading flags, etc.) around
    // until garbage-collected, and the next sign-in can render that
    // stale state for a beat before refetching.
    window.location.href = '/login'
  }

  const value: AuthState = { session, loading, signIn, signOut }
  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>')
  }
  return ctx
}
