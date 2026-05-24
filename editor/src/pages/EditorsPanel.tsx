import { useEffect, useState, FormEvent } from 'react'
import { Crown, Mail, Lock, Trash2, UserPlus, Shuffle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRole, type ProfileRow } from '../lib/role'
import { useTabRefocus } from '../lib/useTabRefocus'

// Build a 24-char random password from a safe charset (no ambiguous
// characters like 0/O, l/1) so the chief can copy or read it aloud.
function randomPassword(len = 24) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  const buf = new Uint8Array(len)
  crypto.getRandomValues(buf)
  let out = ''
  for (let i = 0; i < len; i++) out += charset[buf[i] % charset.length]
  return out
}

export default function EditorsPanel() {
  const { isChief, loading } = useRole()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const refetch = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) {
        setMessage({ kind: 'err', text: error.message })
        return
      }
      setProfiles((data as ProfileRow[]) ?? [])
    } catch (err: any) {
      // AbortError from the 15 s fetch timeout, etc. — don't wipe
      // the existing list; surface the error so the user can retry.
      setMessage({ kind: 'err', text: err?.message ?? 'Failed to load editors' })
    }
  }

  useEffect(() => { if (isChief) refetch() }, [isChief])
  useTabRefocus(() => { if (isChief) refetch() })

  if (loading) return <div className="panel"><div className="panel__loading">Loading…</div></div>

  if (!isChief) {
    return (
      <div className="panel">
        <div className="panel__head">
          <div>
            <h1 className="panel__title">Editors</h1>
            <p className="panel__sub">Only the editor-in-chief can manage editors.</p>
          </div>
        </div>
      </div>
    )
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    const email = newEmail.trim().toLowerCase()
    const password = newPassword
    if (!email) return
    if (password.length < 8) {
      setMessage({ kind: 'err', text: 'Password must be at least 8 characters.' })
      return
    }
    setCreating(true); setMessage(null)
    try {
      // Grab the current access token so the function can verify we're chief.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not signed in')
      const resp = await fetch('/.netlify/functions/create-editor', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, password }),
      })
      const body = await resp.json().catch(() => ({}))
      if (!resp.ok || !body?.ok) {
        throw new Error(body?.error ?? `Request failed: ${resp.status}`)
      }
      setMessage({
        kind: 'ok',
        text: body.mode === 'reset'
          ? `Password reset for ${email}. They can sign in now.`
          : `Editor ${email} created. They can sign in now.`,
      })
      setNewEmail('')
      setNewPassword('')
      refetch()
    } catch (err: any) {
      setMessage({ kind: 'err', text: err?.message ?? String(err) })
    } finally {
      setCreating(false)
    }
  }

  const setRole = async (p: ProfileRow, role: 'chief' | 'editor') => {
    if (role === 'editor' && p.role === 'chief') {
      const chiefCount = profiles.filter(x => x.role === 'chief').length
      if (chiefCount <= 1) {
        setMessage({ kind: 'err', text: 'There must be at least one chief.' })
        return
      }
    }
    const { error } = await supabase.from('profiles').update({ role }).eq('user_id', p.user_id)
    if (error) { setMessage({ kind: 'err', text: error.message }); return }
    setMessage({ kind: 'ok', text: `${p.email} is now ${role}.` })
    refetch()
  }

  const remove = async (p: ProfileRow) => {
    if (p.role === 'chief') {
      setMessage({ kind: 'err', text: 'Cannot delete a chief account directly. Demote first.' })
      return
    }
    if (!confirm(`Revoke ${p.email}'s access?`)) return
    const { error } = await supabase.from('profiles').delete().eq('user_id', p.user_id)
    if (error) { setMessage({ kind: 'err', text: error.message }); return }
    setMessage({ kind: 'ok', text: `${p.email} removed.` })
    refetch()
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Editors</h1>
          <p className="panel__sub">{profiles.length} account{profiles.length === 1 ? '' : 's'} · chief manages roles</p>
        </div>
      </div>

      <form className="invite" onSubmit={onCreate}>
        <div className="invite__field">
          <Mail size={14} />
          <input
            type="email"
            required
            autoComplete="off"
            placeholder="new-editor@example.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
          />
        </div>
        <div className="invite__field">
          <Lock size={14} />
          <input
            type="text"
            required
            autoComplete="off"
            placeholder="password (min 8 chars)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            className="icon-btn"
            title="Generate random password"
            onClick={() => setNewPassword(randomPassword())}
          >
            <Shuffle size={14} />
          </button>
        </div>
        <button className="btn btn--primary" disabled={creating}>
          <UserPlus size={14} /> {creating ? 'Creating…' : 'Create editor'}
        </button>
      </form>
      <p className="invite__hint">
        The new editor signs in with this email + password immediately — no email round-trip.
        Share the credentials with them over a secure channel; they can change the password later.
      </p>

      {message && (
        <div className={`flash flash--${message.kind}`}>{message.text}</div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(p => (
            <tr key={p.user_id}>
              <td>
                <div className="table__title">{p.email}</div>
              </td>
              <td>
                {p.role === 'chief' ? (
                  <span className="tag tag--chief"><Crown size={12} /> Chief</span>
                ) : (
                  <span className="tag">Editor</span>
                )}
              </td>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td className="table__actions">
                {p.role === 'editor' ? (
                  <button className="icon-btn" onClick={() => setRole(p, 'chief')}>Promote to chief</button>
                ) : (
                  <button className="icon-btn" onClick={() => setRole(p, 'editor')}>Demote to editor</button>
                )}
                <button className="icon-btn icon-btn--danger" onClick={() => remove(p)}><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr><td colSpan={4} className="table__empty">No accounts yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
