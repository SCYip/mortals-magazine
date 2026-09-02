import { useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { LeaderRow } from '../lib/types'
import { useTabRefocus } from '../lib/useTabRefocus'

export default function LeadersPanel() {
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [editing, setEditing] = useState<Partial<LeaderRow> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refetch = async () => {
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from('leaders').select('*').order('former').order('sort_order')
      if (error) throw error
      setRows((data as LeaderRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load leaders')
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setBusy(true)
    try {
      const former = editing.former ?? false
      const payload = {
        name: editing.name,
        role: editing.role,
        // A current leader has no college to show, so don't persist a stray
        // value if the field was filled in before "Former" was unticked.
        college: former ? (editing.college || null) : null,
        former,
        active: editing.active ?? true,
        sort_order: editing.sort_order ?? rows.filter(r => r.former === former).length,
      }
      if (editing.id) {
        const { error } = await supabase.from('leaders').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('leaders').insert(payload)
        if (error) throw error
      }
      setEditing(null); refetch()
    } catch (e: any) {
      alert(e?.message ?? 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (r: LeaderRow) => {
    if (!confirm(`Remove ${r.name} from the leadership list?`)) return
    const { error } = await supabase.from('leaders').delete().eq('id', r.id)
    if (error) { alert(error.message); return }
    refetch()
  }

  const groups: Array<[boolean, string]> = [[false, 'Current leadership'], [true, 'Former leadership']]

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Leadership</h1>
          <p className="panel__sub">
            Who runs the magazine now, and who ran it before. Shown on the About page,
            separately from the editorial board and alumni.
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setEditing({ former: false, active: true })}>
          <Plus size={14} /> Add leader
        </button>
      </div>

      {loadError && (
        <div className="flash flash--err">{loadError} · <button className="link-btn" onClick={refetch}>Retry</button></div>
      )}

      {groups.map(([former, label]) => {
        const list = rows.filter(r => r.former === former)
        if (list.length === 0) return null
        return (
          <section key={String(former)} className="panel__group">
            <h2 className="panel__group-title">{label}</h2>
            <div className="cards">
              {list.map(r => (
                <div key={r.id} className={`card card--flat ${!r.active ? 'is-inactive' : ''}`}>
                  <div className="card__body">
                    <div className="card__title">{r.name}</div>
                    <div className="card__meta">{r.role}</div>
                    {r.college && <div className="card__sub">{r.college}</div>}
                    <div className="card__actions">
                      <button className="icon-btn" onClick={() => setEditing(r)}>Edit</button>
                      <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {rows.length === 0 && !loadError && <p className="panel__loading">No leaders yet.</p>}

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <form className="modal__card" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h2 className="modal__title">{editing.id ? 'Edit' : 'Add'} leader</h2>

            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Name *</span>
                <input required value={editing.name ?? ''}
                  onChange={e => setEditing(s => ({ ...s!, name: e.target.value }))} />
              </label>
              <label className="form__field">
                <span>Role *</span>
                <input required placeholder="Editor in Chief" value={editing.role ?? ''}
                  onChange={e => setEditing(s => ({ ...s!, role: e.target.value }))} />
              </label>
            </div>

            <label className="form__field form__field--check">
              <input type="checkbox" checked={editing.former ?? false}
                onChange={e => setEditing(s => ({ ...s!, former: e.target.checked }))} />
              <span>Former leader (moves them to the “Former leadership” group)</span>
            </label>

            {editing.former && (
              <label className="form__field">
                <span>College</span>
                <input placeholder="Stanford" value={editing.college ?? ''}
                  onChange={e => setEditing(s => ({ ...s!, college: e.target.value }))} />
              </label>
            )}

            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Sort order</span>
                <input type="number" value={editing.sort_order ?? ''}
                  onChange={e => setEditing(s => ({ ...s!, sort_order: Number(e.target.value) }))} />
              </label>
              <label className="form__field form__field--check">
                <input type="checkbox" checked={editing.active ?? true}
                  onChange={e => setEditing(s => ({ ...s!, active: e.target.checked }))} />
                <span>Visible on the site</span>
              </label>
            </div>

            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={busy}>
                <Save size={14} /> {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
