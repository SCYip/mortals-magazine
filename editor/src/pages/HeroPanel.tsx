import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Upload, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase, uploadImage } from '../lib/supabase'
import type { HeroSlideRow } from '../lib/types'
import { resolveImageUrl } from '../components/ImageStrip'
import { useTabRefocus } from '../lib/useTabRefocus'

export default function HeroPanel() {
  const [rows, setRows] = useState<HeroSlideRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasLoadedOnce = useRef(false)
  const refetch = async () => {
    if (!hasLoadedOnce.current) setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order')
      if (error) throw error
      setRows((data as HeroSlideRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load hero slides')
    } finally {
      setLoading(false)
      hasLoadedOnce.current = true
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)

  const onUpload = async (file: File) => {
    setBusy(true)
    try {
      const url = await uploadImage('hero', file)
      const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), -1)
      await supabase.from('hero_slides').insert({ image_url: url, alt_text: '', sort_order: maxOrder + 1, active: true })
      refetch()
    } catch (e: any) { alert(e?.message ?? 'Upload failed') }
    finally { setBusy(false) }
  }
  const toggle = async (r: HeroSlideRow) => {
    await supabase.from('hero_slides').update({ active: !r.active }).eq('id', r.id)
    refetch()
  }
  const remove = async (r: HeroSlideRow) => {
    if (!confirm('Delete this slide?')) return
    await supabase.from('hero_slides').delete().eq('id', r.id)
    refetch()
  }
  const move = async (r: HeroSlideRow, dir: -1 | 1) => {
    const idx = rows.findIndex(x => x.id === r.id)
    const j = idx + dir
    if (j < 0 || j >= rows.length) return
    const other = rows[j]
    await Promise.all([
      supabase.from('hero_slides').update({ sort_order: other.sort_order }).eq('id', r.id),
      supabase.from('hero_slides').update({ sort_order: r.sort_order }).eq('id', other.id),
    ])
    refetch()
  }
  const updateAlt = async (r: HeroSlideRow, alt_text: string) => {
    await supabase.from('hero_slides').update({ alt_text }).eq('id', r.id)
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, alt_text } : x))
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Hero rotation</h1>
          <p className="panel__sub">{rows.filter(r => r.active).length} active · {rows.length} total</p>
        </div>
        <label className="btn btn--primary">
          <Upload size={14} /> {busy ? 'Uploading…' : 'Add slide'}
          <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      </div>

      {loadError && (
        <div className="flash flash--err">
          {loadError} · <button className="link-btn" onClick={refetch}>Retry</button>
        </div>
      )}
      {loading && <div className="panel__loading">Loading…</div>}

      <div className="hero-grid">
        {rows.map((r, i) => (
          <div key={r.id} className={`hero-card ${!r.active ? 'is-inactive' : ''}`}>
            <div className="hero-card__thumb" style={{ backgroundImage: `url(${resolveImageUrl(r.image_url)})` }}>
              <div className="hero-card__order">{i + 1}</div>
            </div>
            <input
              className="hero-card__alt"
              placeholder="Alt text (optional)"
              defaultValue={r.alt_text}
              onBlur={e => e.target.value !== r.alt_text && updateAlt(r, e.target.value)}
            />
            <div className="hero-card__actions">
              <button className="icon-btn" onClick={() => move(r, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
              <button className="icon-btn" onClick={() => move(r, 1)} disabled={i === rows.length - 1}><ArrowDown size={14} /></button>
              <button className="icon-btn" onClick={() => toggle(r)}>{r.active ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="panel__loading">No slides yet — upload your first.</div>
        )}
      </div>
    </div>
  )
}
