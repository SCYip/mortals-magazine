import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { session, signIn, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!authLoading && session) return <Navigate to="/articles" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null); setBusy(true)
    try {
      await signIn(email, password)
      // Full reload rather than SPA navigate. We've fought a race
      // multiple times where the panel mounts before supabase-js's
      // in-memory session is fully wired into PostgrestClient — the
      // first refetch goes out with anon auth, comes back with the
      // RLS-filtered subset (or zero), and the user stares at a
      // "0 total" panel. A reload lets the fresh page read the
      // persisted session from storage and start clean.
      window.location.href = '/articles'
    }
    catch (e: any) { setErr(e?.message ?? 'Sign in failed'); setBusy(false) }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">The Mortals</div>
        <div className="login__sub">Editor Panel</div>
        <form className="login__form" onSubmit={submit}>
          <label className="login__label">
            <span>Email</span>
            <input
              type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="editor@themortals.example"
            />
          </label>
          <label className="login__label">
            <span>Password</span>
            <input
              type="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </label>
          {err && <div className="login__error">{err}</div>}
          <button type="submit" className="login__btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login__hint">
          Don't have an account? Ask the editor-in-chief to invite you via the
          Supabase dashboard.
        </p>
      </div>
    </div>
  )
}
