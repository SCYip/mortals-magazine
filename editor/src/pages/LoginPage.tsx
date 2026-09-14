import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { session, signIn, resetPassword, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // 'forgot' swaps the form for a single email field; 'sent' is the
  // confirmation after Supabase accepts the request.
  const [mode, setMode] = useState<'signin' | 'forgot' | 'sent'>('signin')

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

  const sendReset = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null); setBusy(true)
    try {
      await resetPassword(email.trim())
      setMode('sent')
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send reset email')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'sent') {
    return (
      <div className="login">
        <div className="login__card">
          <div className="login__brand">The Mortals</div>
          <div className="login__sub">Editor Panel</div>
          <p className="login__hint login__hint--lead">
            If <strong>{email}</strong> has an account, a reset link is on its way.
            Open it on this device and you'll be asked to choose a new password.
          </p>
          <p className="login__hint">
            Nothing after a few minutes? Check spam, then{' '}
            <button type="button" className="login__link" onClick={() => setMode('forgot')}>try again</button>.
          </p>
          <button type="button" className="login__link" onClick={() => setMode('signin')}>← Back to sign in</button>
        </div>
      </div>
    )
  }

  if (mode === 'forgot') {
    return (
      <div className="login">
        <div className="login__card">
          <div className="login__brand">The Mortals</div>
          <div className="login__sub">Reset your password</div>
          <form className="login__form" onSubmit={sendReset}>
            <label className="login__label">
              <span>Email</span>
              <input
                type="email" autoComplete="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            {err && <div className="login__error">{err}</div>}
            <button type="submit" className="login__btn" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a reset link'}
            </button>
          </form>
          <button type="button" className="login__link" onClick={() => { setErr(null); setMode('signin') }}>← Back to sign in</button>
        </div>
      </div>
    )
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
          <button type="button" className="login__link login__link--forgot" onClick={() => { setErr(null); setMode('forgot') }}>
            Forgot password?
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
