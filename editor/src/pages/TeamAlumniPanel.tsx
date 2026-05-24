import { useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Save, Upload } from 'lucide-react'
import { supabase, uploadImage } from '../lib/supabase'
import type { TeamMemberRow, AlumRow } from '../lib/types'
import ImageStrip, { resolveImageUrl } from '../components/ImageStrip'
import { useTabRefocus } from '../lib/useTabRefocus'

type Tab = 'team' | 'alumni'

export default function TeamAlumniPanel() {
  const [tab, setTab] = useState<Tab>('team')
  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Team &amp; Alumni</h1>
          <p className="panel__sub">Editorial board and past contributors shown on the About page</p>
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === 'team' ? 'is-active' : ''}`} onClick={() => setTab('team')}>Team</button>
        <button className={`tab ${tab === 'alumni' ? 'is-active' : ''}`} onClick={() => setTab('alumni')}>Alumni</button>
      </div>
      {tab === 'team' ? <TeamSection /> : <AlumniSection />}
    </div>
  )
}

function TeamSection() {
  const [rows, setRows] = useState<TeamMemberRow[]>([])
  const [editing, setEditing] = useState<Partial<TeamMemberRow> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const refetch = async () => {
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('team_members').select('*').order('sort_order')
      if (error) throw error
      setRows((data as TeamMemberRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load team')
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)
  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = { ...editing, sort_order: editing.sort_order ?? rows.length }
    if (editing.id) await supabase.from('team_members').update(payload).eq('id', editing.id)
    else await supabase.from('team_members').insert(payload)
    setEditing(null); refetch()
  }
  const remove = async (r: TeamMemberRow) => {
    if (!confirm(`Remove ${r.name} from the team?`)) return
    await supabase.from('team_members').delete().eq('id', r.id); refetch()
  }
  return (
    <>
      {loadError && (
        <div className="flash flash--err">
          {loadError} · <button className="link-btn" onClick={refetch}>Retry</button>
        </div>
      )}
      <div className="subhead">
        <button className="btn btn--primary" onClick={() => setEditing({ active: true })}>
          <Plus size={14} /> Add team member
        </button>
      </div>
      <div className="cards">
        {rows.map(r => (
          <div key={r.id} className={`card card--flat ${!r.active ? 'is-inactive' : ''}`}>
            <div className="card__body">
              <div className="card__title">{r.name}</div>
              <div className="card__meta">{r.role}</div>
              <div className="card__sub">{r.school} {r.class_year}</div>
              <div className="card__images">
                <span className="card__images-label">Images</span>
                <ImageStrip images={[r.portrait_url]} />
              </div>
              <div className="card__actions">
                <button className="icon-btn" onClick={() => setEditing(r)}>Edit</button>
                <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <PersonEditor
          bucket="alumni" /* portraits all go to alumni-portraits bucket for simplicity */
          row={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onChange={setEditing}
          fields={[
            ['name', 'Name *', 'text', true],
            ['role', 'Role *', 'text', true],
            ['class_year', 'Class', 'text', false],
            ['school', 'School', 'text', false],
            ['bio', 'Bio', 'textarea', false],
          ]}
          withActive
        />
      )}
    </>
  )
}

function AlumniSection() {
  const [rows, setRows] = useState<AlumRow[]>([])
  const [editing, setEditing] = useState<Partial<AlumRow> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const refetch = async () => {
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('alumni').select('*').order('sort_order')
      if (error) throw error
      setRows((data as AlumRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load alumni')
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)
  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = { ...editing, sort_order: editing.sort_order ?? rows.length }
    if (editing.id) await supabase.from('alumni').update(payload).eq('id', editing.id)
    else await supabase.from('alumni').insert(payload)
    setEditing(null); refetch()
  }
  const remove = async (r: AlumRow) => {
    if (!confirm(`Remove ${r.name} from alumni?`)) return
    await supabase.from('alumni').delete().eq('id', r.id); refetch()
  }
  return (
    <>
      {loadError && (
        <div className="flash flash--err">
          {loadError} · <button className="link-btn" onClick={refetch}>Retry</button>
        </div>
      )}
      <div className="subhead">
        <button className="btn btn--primary" onClick={() => setEditing({})}>
          <Plus size={14} /> Add alum
        </button>
      </div>
      <div className="cards">
        {rows.map(r => (
          <div key={r.id} className="card card--flat">
            <div className="card__body">
              <div className="card__title">{r.name}</div>
              <div className="card__meta">{r.role}</div>
              <div className="card__sub">{r.school} {r.class_year}</div>
              {r.note && <p className="card__note">{r.note}</p>}
              <div className="card__images">
                <span className="card__images-label">Images</span>
                <ImageStrip images={[r.portrait_url]} />
              </div>
              <div className="card__actions">
                <button className="icon-btn" onClick={() => setEditing(r)}>Edit</button>
                <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <PersonEditor
          bucket="alumni"
          row={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onChange={setEditing}
          fields={[
            ['name', 'Name *', 'text', true],
            ['role', 'Role *', 'text', true],
            ['class_year', 'Class', 'text', false],
            ['school', 'School', 'text', false],
            ['note', 'Note', 'textarea', false],
          ]}
        />
      )}
    </>
  )
}

interface PersonEditorProps {
  bucket: 'alumni'
  row: any
  onClose: () => void
  onSave: (e: FormEvent) => void
  onChange: (r: any) => void
  fields: [string, string, 'text' | 'textarea', boolean][]
  withActive?: boolean
}
function PersonEditor({ row, onClose, onSave, onChange, fields, withActive }: PersonEditorProps) {
  const onUpload = async (file: File) => {
    const url = await uploadImage('alumni', file)
    onChange({ ...row, portrait_url: url })
  }
  return (
    <div className="modal" onClick={onClose}>
      <form className="modal__card" onClick={e => e.stopPropagation()} onSubmit={onSave}>
        <h2 className="modal__title">{row.id ? 'Edit' : 'Add'}</h2>
        <div className="form__field">
          <span>Portrait</span>
          <div className="upload">
            {row.portrait_url && <img src={resolveImageUrl(row.portrait_url)} alt="" className="upload__preview upload__preview--portrait" />}
            <label className="upload__btn"><Upload size={14} /> Upload
              <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          </div>
        </div>
        {fields.map(([key, label, kind, required]) => (
          <label key={key} className="form__field">
            <span>{label}</span>
            {kind === 'textarea' ? (
              <textarea required={required} rows={4} value={row[key] ?? ''} onChange={e => onChange({ ...row, [key]: e.target.value })} />
            ) : (
              <input required={required} value={row[key] ?? ''} onChange={e => onChange({ ...row, [key]: e.target.value })} />
            )}
          </label>
        ))}
        {withActive && (
          <label className="form__field form__field--inline">
            <input type="checkbox" checked={row.active ?? true} onChange={e => onChange({ ...row, active: e.target.checked })} />
            <span>Active (shown on public site)</span>
          </label>
        )}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary"><Save size={14} /> Save</button>
        </div>
      </form>
    </div>
  )
}
