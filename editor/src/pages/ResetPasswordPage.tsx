import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '../lib/auth'

/**
 * Landing page for the password-recovery email.
 *
 * The link Supabase sends carries a one-time code. supabase-js exchanges it
 * for a session on page load (detectSessionInUrl), so by the time this
 * renders with `session` set, the user is signed in with recovery rights
 * and updateUser({ password }) is allowed. We just wait for that session,
 * take the new password, and send them into the panel.
 */
export default function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // The code exchange can take a beat after load; don't declare the link
  // dead until auth has settled AND there's still no session.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setSettled(true), 1500)
      return () => clearTimeout(t)
    }
  }, [loading])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (password.length < 8) { setErr('Password must be at least 8 characters'); return }
    if (password !== confirm) { setErr("Passwords don't match"); return }
    setBusy(true)
    try {
      await updatePassword(password)
      // Full reload for the same reason LoginPage does one: let the panel
      // start from a freshly persisted session rather than an in-flight one.
      window.location.href = '/articles'
    } catch (e: any) {
      setErr(e?.message ?? 'Could not update password')
      setBusy(false)
    }
  }

  if (!session) {
    return (
      <div className="login">
        <div className="login__card">
          <div className="login__brand">The Mortals</div>
          <div className="login__sub">Reset your password</div>
          {settled ? (
            <>
              <p className="login__hint login__hint--lead">
                This reset link isn't valid any more — links expire after an hour and
                can only be used once.
              </p>
              <a className="login__link" href="/login">← Request a new one</a>
            </>
          ) : (
            <p className="login__hint">Checking your link…</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">The Mortals</div>
        <div className="login__sub">Choose a new password</div>
        <form className="login__form" onSubmit={submit}>
          <label className="login__label">
            <span>New password</span>
            <input
              type="password" autoComplete="new-password" required autoFocus minLength={8}
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </label>
          <label className="login__label">
            <span>Confirm password</span>
            <input
              type="password" autoComplete="new-password" required minLength={8}
              value={confirm} onChange={e => setConfirm(e.target.value)}
            />
          </label>
          {err && <div className="login__error">{err}</div>}
          <button type="submit" className="login__btn" disabled={busy}>
            {busy ? 'Saving…' : 'Set password and sign in'}
          </button>
        </form>
        <p className="login__hint">Signed in as {session.user.email}</p>
      </div>
    </div>
  )
}
