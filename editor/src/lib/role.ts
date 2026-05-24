/**
 * Role hook — reads the signed-in user's role from public.profiles.
 * Refreshes when the auth session changes.
 */
import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export type Role = 'chief' | 'editor'

export type ProfileRow = {
  user_id: string
  email: string
  role: Role
  created_at: string
}

export function useRole() {
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  // Track whether we've ever successfully loaded the role. Once true,
  // subsequent refetches (tab refocus, SIGNED_IN re-emits, etc.) run
  // silently in the background — no "Loading…" skeleton, no flash,
  // no UI blink.
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false
    const fetchRole = async () => {
      if (!hasLoadedOnce.current) setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (!cancelled) setRole(null)
          return
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (cancelled) return
        if (error) {
          console.warn('[role] fetch error:', error.message)
          setRole(null)
        } else {
          setRole((data?.role as Role) ?? 'editor')
        }
      } catch (err: any) {
        // AbortError from the 15 s fetch timeout, network error, etc.
        // Leave the previous role in place rather than wiping it.
        if (!cancelled) console.warn('[role] fetch threw:', err?.message ?? err)
      } finally {
        if (!cancelled) {
          setLoading(false)
          hasLoadedOnce.current = true
        }
      }
    }
    fetchRole()
    const { data: sub } = supabase.auth.onAuthStateChange(() => fetchRole())
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  return { role, loading, isChief: role === 'chief' }
}
