import { useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AckRow } from '../lib/types'
import { useTabRefocus } from '../lib/useTabRefocus'

export default function AcknowledgementsPanel() {
  const [rows, setRows] = useState<AckRow[]>([])
  const [editing, setEditing] = useState<Partial<AckRow> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refetch = async () => {
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('acknowledgements').select('*').order('sort_order')
      if (error) throw error
      setRows((data as AckRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load acknowledgements')
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setBusy(true)
    try {
      const payload = {
        name: editing.name,
        role: editing.role ?? '',
        note: editing.note ?? '',
        sort_order: editing.sort_order ?? rows.length,
      }
      if (editing.id) {
        const { error } = await supabase.from('acknowledgements').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('acknowledgements').insert(payload)
        if (error) throw error
      }
      setEditing(null); refetch()
    } catch (e: any) {
      alert(e?.message ?? 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (r: AckRow) => {
    if (!confirm(`Remove ${r.name} from acknowledgements?`)) return
    const { error } = await supabase.from('acknowledgements').delete().eq('id', r.id)
    if (error) { alert(error.message); return }
    refetch()
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Acknowledgements</h1>
          <p className="panel__sub">The faculty &amp; staff thank-you list shown on the About page.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setEditing({})}><Plus size={14} /> Add person</button>
      </div>

      {loadError && (
        <div className="flash flash--err">{loadError} · <button className="link-btn" onClick={refetch}>Retry</button></div>
      )}

      <div className="cards">
        {rows.map(r => (
          <div key={r.id} className="card card--flat">
            <div className="card__body">
              <div className="card__title">{r.name}</div>
              <div className="card__meta">{r.role}</div>
              {r.note && <p className="card__note">{r.note}</p>}
              <div className="card__actions">
                <button className="icon-btn" onClick={() => setEditing(r)}>Edit</button>
                <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !loadError && <p className="panel__loading">No acknowledgements yet.</p>}
      </div>

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <form className="modal__card" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h2 className="modal__title">{editing.id ? 'Edit' : 'Add'} acknowledgement</h2>
            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Name *</span>
                <input required value={editing.name ?? ''} onChange={e => setEditing(s => ({ ...s!, name: e.target.value }))} />
              </label>
              <label className="form__field">
                <span>Role</span>
                <input value={editing.role ?? ''} onChange={e => setEditing(s => ({ ...s!, role: e.target.value }))} />
              </label>
            </div>
            <label className="form__field">
              <span>Note</span>
              <textarea rows={3} value={editing.note ?? ''} onChange={e => setEditing(s => ({ ...s!, note: e.target.value }))} />
            </label>
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={busy}><Save size={14} /> {busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
