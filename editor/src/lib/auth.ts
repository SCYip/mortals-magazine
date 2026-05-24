import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Single source of truth for the auth session — one Provider at the
// app root, every other component reads via useAuth().
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
    supabase.auth.getSession()
      .then(({ data }) => apply(data.session))
      .catch(err => {
        console.warn('[auth] getSession failed:', err?.message ?? err)
        apply(null)
      })
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
