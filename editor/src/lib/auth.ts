import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const done = (s: Session | null) => {
      if (cancelled) return
      setSession(s)
      setLoading(false)
    }
    // Belt: getSession() should resolve fast, but supabase-js can hang
    // when a token is mid-refresh. Catch + finally guarantees loading
    // never sticks true on this branch.
    supabase.auth.getSession()
      .then(({ data }) => done(data.session))
      .catch(err => {
        console.warn('[auth] getSession failed:', err?.message ?? err)
        done(null)
      })
    // Suspenders: even if the promise above never settles, give up
    // after 4 seconds and let the UI render. The auth-state listener
    // below will fix things once a real event arrives.
    const safetyTimer = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 4000)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
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
  const signOut = async () => { await supabase.auth.signOut() }

  return { session, loading, signIn, signOut }
}
