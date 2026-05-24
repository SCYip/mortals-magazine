/**
 * Role hook — reads the signed-in user's role from public.profiles.
 * Refreshes when the auth session changes.
 */
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    let cancelled = false
    const fetchRole = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) { setRole(null); setLoading(false) }
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
      setLoading(false)
    }
    fetchRole()
    const { data: sub } = supabase.auth.onAuthStateChange(() => fetchRole())
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  return { role, loading, isChief: role === 'chief' }
}
