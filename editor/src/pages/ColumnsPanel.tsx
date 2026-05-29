import { useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Save, Upload } from 'lucide-react'
import { supabase, uploadImage } from '../lib/supabase'
import type { ColumnRow } from '../lib/types'
import { resolveImageUrl } from '../components/ImageStrip'
import { useTabRefocus } from '../lib/useTabRefocus'

function slugify(s: string) {
  return s.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

export default function ColumnsPanel() {
  const [rows, setRows] = useState<ColumnRow[]>([])
  const [editing, setEditing] = useState<Partial<ColumnRow> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refetch = async () => {
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('columns').select('*').order('sort_order')
      if (error) throw error
      setRows((data as ColumnRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load columns')
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)

  const startNew = () => {
    setIsNew(true)
    setEditing({ slug: '', name: '', tagline: '', description: '', image_url: '', color: '#1e56b5', sort_order: rows.length })
  }
  const startEdit = (r: ColumnRow) => { setIsNew(false); setEditing(r) }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setBusy(true)
    try {
      const payload = {
        slug: editing.slug,
        name: editing.name,
        tagline: editing.tagline ?? '',
        description: editing.description ?? '',
        image_url: editing.image_url ?? '',
        color: editing.color || '#1e56b5',
        sort_order: editing.sort_order ?? rows.length,
      }
      if (isNew) {
        const { error } = await supabase.from('columns').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('columns').update(payload).eq('slug', editing.slug!)
        if (error) throw error
      }
      setEditing(null); refetch()
    } catch (e: any) {
      alert(e?.message ?? 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (r: ColumnRow) => {
    if (!confirm(`Delete the "${r.name}" column? Articles stay, but they'll be unlinked from this column.`)) return
    const { error } = await supabase.from('columns').delete().eq('slug', r.slug)
    if (error) { alert(error.message); return }
    refetch()
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Columns</h1>
          <p className="panel__sub">The standing columns shown on the home page and in the nav. Articles are assigned to columns from the article editor.</p>
        </div>
        <button className="btn btn--primary" onClick={startNew}><Plus size={14} /> New column</button>
      </div>

      {loadError && (
        <div className="flash flash--err">{loadError} · <button className="link-btn" onClick={refetch}>Retry</button></div>
      )}

      <div className="cards">
        {rows.map(r => (
          <div key={r.slug} className="card card--flat">
            <div className="card__body">
              <div className="card__title">
                <span className="swatch" style={{ background: r.color }} /> {r.name}
              </div>
              <div className="card__meta">{r.tagline}</div>
              <div className="card__sub">/{r.slug}</div>
              {r.description && <p className="card__note">{r.description}</p>}
              <div className="card__actions">
                <button className="icon-btn" onClick={() => startEdit(r)}>Edit</button>
                <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !loadError && <p className="panel__loading">No columns yet.</p>}
      </div>

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <form className="modal__card" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h2 className="modal__title">{isNew ? 'New column' : `Edit · ${editing.name}`}</h2>

            <div className="form__field">
              <span>Cover image</span>
              <div className="upload">
                {editing.image_url && <img src={resolveImageUrl(editing.image_url)} alt="" className="upload__preview" />}
                <label className="upload__btn">
                  <Upload size={14} /> {editing.image_url ? 'Replace' : 'Upload'}
                  <input type="file" accept="image/*" hidden onChange={async e => {
                    const f = e.target.files?.[0]; if (!f) return
                    setBusy(true)
                    try { const url = await uploadImage('volume', f); setEditing(s => ({ ...s!, image_url: url })) }
                    catch (err: any) { alert(err?.message ?? 'Upload failed') }
                    finally { setBusy(false) }
                  }} />
                </label>
              </div>
            </div>

            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Name *</span>
                <input required value={editing.name ?? ''} onChange={e => setEditing(s => ({ ...s!, name: e.target.value, slug: isNew && !s!.slug ? slugify(e.target.value) : s!.slug }))} />
              </label>
              <label className="form__field">
                <span>Slug *</span>
                <input required disabled={!isNew} title={isNew ? '' : 'Slug is locked after creation (articles link to it)'} value={editing.slug ?? ''} onChange={e => setEditing(s => ({ ...s!, slug: slugify(e.target.value) }))} />
              </label>
            </div>

            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Tagline</span>
                <input value={editing.tagline ?? ''} onChange={e => setEditing(s => ({ ...s!, tagline: e.target.value }))} />
              </label>
              <label className="form__field">
                <span>Accent color</span>
                <input type="color" value={editing.color || '#1e56b5'} onChange={e => setEditing(s => ({ ...s!, color: e.target.value }))} />
              </label>
            </div>

            <label className="form__field">
              <span>Description</span>
              <textarea rows={4} value={editing.description ?? ''} onChange={e => setEditing(s => ({ ...s!, description: e.target.value }))} />
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
