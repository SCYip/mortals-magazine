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
    try { await signIn(email, password) }
    catch (e: any) { setErr(e?.message ?? 'Sign in failed') }
    finally { setBusy(false) }
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
