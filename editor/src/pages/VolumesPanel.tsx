import { useEffect, useRef, useState, FormEvent } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase, uploadImage } from '../lib/supabase'
import type { VolumeRow, IssueRow } from '../lib/types'
import ImageStrip, { resolveImageUrl } from '../components/ImageStrip'
import { useTabRefocus } from '../lib/useTabRefocus'

function slugify(s: string) {
  return s.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export default function VolumesPanel() {
  const [volumes, setVolumes] = useState<VolumeRow[]>([])
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<VolumeRow> | null>(null)

  const hasLoadedOnce = useRef(false)
  const refetch = async () => {
    if (!hasLoadedOnce.current) setLoading(true)
    setLoadError(null)
    try {
      const [vs, is_] = await Promise.all([
        supabase.from('volumes').select('*').order('sort_order'),
        supabase.from('issues').select('*').order('sort_order'),
      ])
      if (vs.error) throw vs.error
      if (is_.error) throw is_.error
      setVolumes((vs.data as VolumeRow[]) ?? [])
      setIssues((is_.data as IssueRow[]) ?? [])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load volumes')
    } finally {
      setLoading(false)
      hasLoadedOnce.current = true
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload: Partial<VolumeRow> = {
      slug: editing.slug || slugify(editing.title ?? ''),
      title: editing.title ?? '',
      season: editing.season ?? '',
      year: editing.year ?? '',
      theme: editing.theme ?? '',
      image_url: editing.image_url ?? '',
      sort_order: editing.sort_order ?? volumes.length,
    }
    const { error } = await supabase.from('volumes').upsert(payload, { onConflict: 'slug' })
    if (error) { alert(error.message); return }
    setEditing(null)
    refetch()
  }
  const remove = async (slug: string) => {
    if (!confirm(`Delete volume ${slug}? Issues will also be deleted.`)) return
    await supabase.from('volumes').delete().eq('slug', slug)
    refetch()
  }

  const onUpload = async (file: File) => {
    const url = await uploadImage('volume', file)
    setEditing(s => s ? { ...s, image_url: url } : s)
  }

  // Attach the real magazine PDF to an issue, stored on issues.pdf_url —
  // the public site's Download button serves it. Two paths:
  //  • Upload — for files under Supabase's ~50MB object cap.
  //  • Link — for big print exports: attach the PDF as an asset on the
  //    "magazine-pdfs" GitHub release (repo SCYip/mortals-magazine) and
  //    paste its download URL here.
  const SUPABASE_MAX_UPLOAD = 50 * 1024 * 1024
  const [pdfBusy, setPdfBusy] = useState<string | null>(null)
  const setIssuePdfUrl = async (iss: IssueRow, url: string | null) => {
    const { error } = await supabase.from('issues').update({ pdf_url: url }).eq('slug', iss.slug)
    if (error) { alert(error.message); return }
    refetch()
  }
  const onUploadPdf = async (iss: IssueRow, file: File) => {
    if (file.size > SUPABASE_MAX_UPLOAD) {
      alert(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(0)}MB — over the ~50MB upload limit, so uploading here will always fail.\n\n` +
        'Host big PDFs on GitHub instead:\n' +
        '1. Open github.com/SCYip/mortals-magazine/releases → "Magazine PDFs" → Edit → attach the file\n' +
        "2. Copy the asset's download URL\n" +
        '3. Click "Link" on this issue and paste it',
      )
      return
    }
    setPdfBusy(iss.slug)
    try {
      const url = await uploadImage('volume', file)
      await setIssuePdfUrl(iss, url)
    } catch (e: any) {
      const msg = String(e?.message ?? '')
      alert(/payload too large|maximum allowed size|413/i.test(msg)
        ? 'Upload rejected: the file exceeds the storage size limit. Use "Link" with a GitHub-release URL instead.'
        : (msg || 'PDF upload failed'))
    } finally {
      setPdfBusy(null)
    }
  }
  const onLinkPdf = (iss: IssueRow) => {
    const input = prompt(
      'Paste a public PDF URL for this issue (e.g. a GitHub release asset URL).\nLeave empty to remove the current PDF.',
      iss.pdf_url ?? '',
    )
    if (input === null) return
    const url = input.trim()
    if (url && !/^https?:\/\//i.test(url)) {
      alert('That does not look like a URL (must start with http/https).')
      return
    }
    setIssuePdfUrl(iss, url || null)
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Volumes &amp; Issues</h1>
          <p className="panel__sub">{volumes.length} volumes · {issues.length} issues</p>
        </div>
        <button className="btn btn--primary" onClick={() => setEditing({})}>
          <Plus size={14} /> New volume
        </button>
      </div>

      {loadError && (
        <div className="flash flash--err">
          {loadError} · <button className="link-btn" onClick={refetch}>Retry</button>
        </div>
      )}
      {loading && <div className="panel__loading">Loading…</div>}

      <div className="cards">
        {volumes.map(v => {
          const vIssues = issues.filter(i => i.volume_slug === v.slug)
          return (
            <div key={v.slug} className="card card--flat">
              <div className="card__body">
                <div className="card__meta">{v.season} · {v.year}</div>
                <div className="card__title">{v.title}</div>
                <div className="card__sub">{v.theme}</div>
                <div className="card__sub">{vIssues.length} issue{vIssues.length === 1 ? '' : 's'}</div>
                {vIssues.length > 0 && (
                  <div className="issue-pdfs">
                    <span className="card__images-label">Issue PDFs (Download button serves these)</span>
                    {vIssues.map(iss => (
                      <div key={iss.slug} className="issue-pdfs__row">
                        <span className="issue-pdfs__title">{iss.title}</span>
                        {iss.pdf_url
                          ? <a className="issue-pdfs__has" href={iss.pdf_url} target="_blank" rel="noreferrer">PDF ✓</a>
                          : <span className="issue-pdfs__none">no PDF</span>}
                        <label className="upload__btn upload__btn--sm">
                          {pdfBusy === iss.slug ? 'Uploading…' : (iss.pdf_url ? 'Replace' : 'Upload')}
                          <input type="file" accept="application/pdf" hidden disabled={pdfBusy === iss.slug}
                            onChange={e => e.target.files?.[0] && onUploadPdf(iss, e.target.files[0])} />
                        </label>
                        <button type="button" className="upload__btn upload__btn--sm" onClick={() => onLinkPdf(iss)}>
                          Link
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="card__images">
                  <span className="card__images-label">Images</span>
                  <ImageStrip images={[v.image_url]} />
                </div>
                <div className="card__actions">
                  <button className="icon-btn" onClick={() => setEditing(v)}>Edit</button>
                  <button className="icon-btn icon-btn--danger" onClick={() => remove(v.slug)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <form className="modal__card" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h2 className="modal__title">{editing.slug ? 'Edit volume' : 'New volume'}</h2>
            <label className="form__field">
              <span>Title *</span>
              <input required value={editing.title ?? ''} onChange={e => setEditing(s => ({ ...s!, title: e.target.value }))} />
            </label>
            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Slug</span>
                <input value={editing.slug ?? ''} onChange={e => setEditing(s => ({ ...s!, slug: slugify(e.target.value) }))} placeholder="auto from title" />
              </label>
              <label className="form__field">
                <span>Sort order</span>
                <input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing(s => ({ ...s!, sort_order: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="form__row form__row--two">
              <label className="form__field">
                <span>Season *</span>
                <input required value={editing.season ?? ''} onChange={e => setEditing(s => ({ ...s!, season: e.target.value }))} placeholder="Winter" />
              </label>
              <label className="form__field">
                <span>Year *</span>
                <input required value={editing.year ?? ''} onChange={e => setEditing(s => ({ ...s!, year: e.target.value }))} placeholder="2025-2026" />
              </label>
            </div>
            <label className="form__field">
              <span>Theme</span>
              <input value={editing.theme ?? ''} onChange={e => setEditing(s => ({ ...s!, theme: e.target.value }))} />
            </label>
            <div className="form__field">
              <span>Cover image</span>
              <div className="upload">
                {editing.image_url && <img src={resolveImageUrl(editing.image_url)} alt="" className="upload__preview" />}
                <label className="upload__btn">
                  Upload <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn--primary"><Save size={14} /> Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
