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

// Synchronously read a non-expired session from localStorage if one is
// there. This is the *initial state* for the Provider — it short-cuts
// the chicken-and-egg where Protected renders before supabase-js has
// asynchronously hydrated its in-memory session, so the user sees the
// panel immediately on hard refresh / new tab.
//
// The async `getSession()` then runs and confirms or refines this. If
// supabase-js disagrees (token actually invalid server-side), the
// onAuthStateChange listener will fire SIGNED_OUT and we'll clear.
function readPersistedSession(): Session | null {
  try {
    if (typeof window === 'undefined') return null
    const key = Object.keys(window.localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!key) return null
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.access_token || !parsed?.expires_at) return null
    const now = Math.floor(Date.now() / 1000)
    if (parsed.expires_at <= now) return null // already expired
    return parsed as Session
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readPersistedSession())
  // If we already have a session from storage, there's nothing to wait
  // for — render immediately. getSession() / onAuthStateChange will
  // refresh us in the background.
  const [loading, setLoading] = useState(() => readPersistedSession() === null)

  useEffect(() => {
    let cancelled = false
    const apply = (s: Session | null) => {
      if (cancelled) return
      setSession(s)
      setLoading(false)
    }
    // Confirm/refine the session via supabase-js. If this resolves with
    // a valid session, great. If null, the storage probably had a
    // session that supabase-js considers invalid — clear and redirect.
    // We *don't* have a hard safety timer anymore; if getSession hangs
    // the user just sees the panel from storage. Eventually
    // onAuthStateChange fires with the truth.
    supabase.auth.getSession()
      .then(({ data }) => apply(data.session))
      .catch(err => {
        console.warn('[auth] getSession failed:', err?.message ?? err)
        // Don't wipe the storage-derived session on a transient failure.
        // Just stop the loading spinner so the panel can render.
        if (!cancelled) setLoading(false)
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
