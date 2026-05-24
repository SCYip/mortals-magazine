import { useEffect, useState, FormEvent } from 'react'
import { Crown, Mail, Trash2, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRole, type ProfileRow } from '../lib/role'

export default function EditorsPanel() {
  const { isChief, loading } = useRole()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const refetch = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      setMessage({ kind: 'err', text: error.message })
      return
    }
    setProfiles((data as ProfileRow[]) ?? [])
  }

  useEffect(() => { if (isChief) refetch() }, [isChief])

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

  const onInvite = async (e: FormEvent) => {
    e.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return
    setInviting(true); setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setMessage({
        kind: 'ok',
        text: `Magic-link invitation sent to ${email}. They'll be added as an editor when they click the link in the email.`,
      })
      setInviteEmail('')
    } catch (err: any) {
      setMessage({ kind: 'err', text: err.message ?? String(err) })
    } finally {
      setInviting(false)
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

      <form className="invite" onSubmit={onInvite}>
        <Mail size={14} />
        <input
          type="email"
          required
          placeholder="new-editor@example.com"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
        />
        <button className="btn btn--primary" disabled={inviting}>
          <UserPlus size={14} /> {inviting ? 'Sending…' : 'Invite editor'}
        </button>
      </form>

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
