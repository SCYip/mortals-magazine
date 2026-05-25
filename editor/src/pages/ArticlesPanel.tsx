import { useEffect, useRef, useState, FormEvent } from 'react'
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Edit3, Trash2, Eye, EyeOff, ArrowLeft, Upload } from 'lucide-react'
import { supabase, uploadImage } from '../lib/supabase'
import type { ArticleRow, ColumnRow, Genre } from '../lib/types'
import ImageStrip, { extractImagesFromContent, resolveImageUrl } from '../components/ImageStrip'
import { useTabRefocus } from '../lib/useTabRefocus'

const GENRES: { value: Genre; label: string }[] = [
  { value: 'nonfiction', label: 'Nonfiction' },
  { value: 'fiction-prose', label: 'Fiction (Prose)' },
  { value: 'fiction-poetry', label: 'Fiction (Poetry)' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
]

function slugify(s: string) {
  return s.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export default function ArticlesPanel() {
  return (
    <Routes>
      <Route index element={<ArticlesList />} />
      <Route path="new" element={<ArticleEditor />} />
      <Route path=":id" element={<ArticleEditor />} />
    </Routes>
  )
}

function ArticlesList() {
  const [rows, setRows] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  // Background refetches (tab refocus, etc.) shouldn't blank the
  // panel — show the existing rows while the new ones come in.
  const hasLoadedOnce = useRef(false)

  const refetch = async () => {
    if (!hasLoadedOnce.current) setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('articles').select('*').order('published_at', { ascending: false })
      if (error) throw error
      if (data) setRows(data as ArticleRow[])
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load articles')
    } finally {
      setLoading(false)
      hasLoadedOnce.current = true
    }
  }
  useEffect(() => { refetch() }, [])
  useTabRefocus(refetch)

  const filtered = rows.filter(r =>
    !q || [r.title, r.author, r.slug].join(' ').toLowerCase().includes(q.toLowerCase())
  )

  const togglePublished = async (row: ArticleRow) => {
    await supabase.from('articles').update({ published: !row.published }).eq('id', row.id)
    refetch()
  }
  const remove = async (row: ArticleRow) => {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return
    await supabase.from('articles').delete().eq('id', row.id)
    refetch()
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Articles</h1>
          <p className="panel__sub">{rows.length} total · {rows.filter(r => r.published).length} published</p>
        </div>
        <Link to="new" className="btn btn--primary">
          <Plus size={14} /> New article
        </Link>
      </div>

      <input
        className="panel__search"
        placeholder="Search by title, author, or slug…"
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {loadError && (
        <div className="flash flash--err">
          {loadError} · <button className="link-btn" onClick={refetch}>Retry</button>
        </div>
      )}
      {loading && <div className="panel__loading">Loading…</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Date</th>
            <th>Status</th>
            <th>Images</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => {
            const inline = extractImagesFromContent(r.content)
            // De-dupe — cover may also appear in content
            const all = Array.from(new Set([r.image_url, ...inline].filter(Boolean)))
            return (
              <tr key={r.id}>
                <td>
                  <div className="table__title">{r.title}</div>
                  <div className="table__slug">/{r.slug}</div>
                </td>
                <td>{r.author}</td>
                <td><span className="tag">{r.genre}</span></td>
                <td>{r.date_label}</td>
                <td>
                  <button className="icon-btn" title={r.published ? 'Unpublish' : 'Publish'} onClick={() => togglePublished(r)}>
                    {r.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{r.published ? 'Published' : 'Draft'}</span>
                  </button>
                </td>
                <td className="table__images-cell"><ImageStrip images={all} /></td>
                <td className="table__actions">
                  <Link to={String(r.id)} className="icon-btn"><Edit3 size={14} /></Link>
                  <button className="icon-btn icon-btn--danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
                </td>
              </tr>
            )
          })}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={7} className="table__empty">No articles {q ? 'match your search' : 'yet'}.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ArticleEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [row, setRow] = useState<Partial<ArticleRow>>({
    slug: '', title: '', author: '', author_affiliation: '', date_label: '',
    genre: 'other', excerpt: '', content: '', image_url: '', column_slug: null,
    tags: [], published: true,
  })
  const [columns, setColumns] = useState<ColumnRow[]>([])
  // Multi-column membership — source of truth for the article ↔ columns
  // relationship. The legacy `column_slug` on the row is auto-synced to
  // the FIRST entry in this list so older code paths keep working.
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    supabase.from('columns').select('*').order('sort_order')
      .then(({ data }) => setColumns((data as ColumnRow[]) ?? []))
  }, [])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    // Fetch the article AND its column links in parallel.
    Promise.all([
      supabase.from('articles').select('*').eq('id', Number(id)).single(),
      supabase.from('article_columns').select('column_slug').eq('article_id', Number(id)),
    ]).then(([artRes, linkRes]) => {
      if (artRes.error || !artRes.data) {
        setErr(artRes.error?.message ?? 'Not found'); setLoading(false); return
      }
      const r = artRes.data as ArticleRow
      setRow(r)
      setTagsInput((r.tags ?? []).join(', '))
      const linked = (linkRes.data ?? []).map((l: { column_slug: string }) => l.column_slug)
      // If the junction is empty but the legacy column_slug is set,
      // treat the legacy value as the initial selection so unmigrated
      // rows still show their column.
      setSelectedColumns(linked.length > 0 ? linked : (r.column_slug ? [r.column_slug] : []))
      setLoading(false)
    })
  }, [id, isNew])

  const toggleColumn = (slug: string) => {
    setSelectedColumns(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug],
    )
  }

  const onTitleChange = (v: string) => {
    setRow(s => ({ ...s, title: v, slug: isNew && !s.slug ? slugify(v) : s.slug }))
  }

  const onUpload = async (file: File) => {
    setBusy(true); setErr(null)
    try {
      const url = await uploadImage('article', file)
      setRow(s => ({ ...s, image_url: url }))
    } catch (e: any) { setErr(e?.message ?? 'Upload failed') }
    finally { setBusy(false) }
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      // Keep legacy column_slug in sync with the first selected column
      // so consumers that haven't migrated yet still see *a* column.
      const payload = {
        ...row,
        column_slug: selectedColumns[0] ?? null,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        date_label: row.date_label || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
      let articleId: number
      if (isNew) {
        const { data, error } = await supabase.from('articles').insert(payload).select().single()
        if (error) throw error
        articleId = data.id
      } else {
        articleId = Number(id)
        const { error } = await supabase.from('articles').update(payload).eq('id', articleId)
        if (error) throw error
      }
      // Replace the article ↔ columns mapping: wipe and re-insert.
      // Cheaper than a diff for a small membership set.
      await supabase.from('article_columns').delete().eq('article_id', articleId)
      if (selectedColumns.length > 0) {
        const linkRows = selectedColumns.map(slug => ({ article_id: articleId, column_slug: slug }))
        const { error: linkErr } = await supabase.from('article_columns').insert(linkRows)
        if (linkErr) throw linkErr
      }
      if (isNew) navigate(`/articles/${articleId}`)
    } catch (e: any) { setErr(e?.message ?? 'Save failed') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="panel"><div className="panel__loading">Loading…</div></div>

  return (
    <div className="panel">
      <div className="panel__head">
        <Link to="/articles" className="icon-btn"><ArrowLeft size={14} /> Back</Link>
        <h1 className="panel__title">{isNew ? 'New article' : `Edit · ${row.title}`}</h1>
      </div>

      <form className="form" onSubmit={save}>
        <div className="form__row form__row--two">
          <label className="form__field">
            <span>Title *</span>
            <input required value={row.title ?? ''} onChange={e => onTitleChange(e.target.value)} />
          </label>
          <label className="form__field">
            <span>Slug *</span>
            <input required value={row.slug ?? ''} onChange={e => setRow(s => ({ ...s, slug: slugify(e.target.value) }))} />
          </label>
        </div>

        <div className="form__row form__row--three">
          <label className="form__field">
            <span>Author *</span>
            <input required value={row.author ?? ''} onChange={e => setRow(s => ({ ...s, author: e.target.value }))} />
          </label>
          <label className="form__field">
            <span>Affiliation</span>
            <input value={row.author_affiliation ?? ''} onChange={e => setRow(s => ({ ...s, author_affiliation: e.target.value }))} />
          </label>
          <label className="form__field">
            <span>Date label *</span>
            <input required placeholder="Jan 25, 2025" value={row.date_label ?? ''} onChange={e => setRow(s => ({ ...s, date_label: e.target.value }))} />
          </label>
        </div>

        <div className="form__row form__row--two">
          <label className="form__field">
            <span>Genre *</span>
            <select required value={row.genre ?? 'other'} onChange={e => setRow(s => ({ ...s, genre: e.target.value as Genre }))}>
              {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </label>
          <div className="form__field">
            <span>
              Columns
              {selectedColumns.length > 0 && (
                <span className="form__hint"> · {selectedColumns.length} selected</span>
              )}
            </span>
            <div className="checkbox-grid">
              {columns.map(c => {
                const checked = selectedColumns.includes(c.slug)
                return (
                  <label key={c.slug} className={`checkbox-chip ${checked ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColumn(c.slug)}
                    />
                    <span>{c.name}</span>
                  </label>
                )
              })}
              {columns.length === 0 && (
                <span className="form__hint">No columns defined yet.</span>
              )}
            </div>
          </div>
        </div>

        <label className="form__field">
          <span>Excerpt *</span>
          <textarea required rows={3} value={row.excerpt ?? ''} onChange={e => setRow(s => ({ ...s, excerpt: e.target.value }))} />
        </label>

        <label className="form__field">
          <span>Content * (plain text — line breaks become paragraph breaks)</span>
          <textarea required rows={18} value={row.content ?? ''} onChange={e => setRow(s => ({ ...s, content: e.target.value }))} className="form__field--mono" />
        </label>

        <div className="form__row form__row--two">
          <div className="form__field">
            <span>Cover image</span>
            <div className="upload">
              {row.image_url && <img src={resolveImageUrl(row.image_url)} alt="" className="upload__preview" />}
              <label className="upload__btn">
                <Upload size={14} /> {row.image_url ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
              </label>
              {row.image_url && (
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => setRow(s => ({ ...s, image_url: '' }))}>Remove</button>
              )}
            </div>
          </div>
          <label className="form__field">
            <span>Tags (comma-separated)</span>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="poetry, climate, debut" />
          </label>
        </div>

        <label className="form__field form__field--inline">
          <input type="checkbox" checked={row.published ?? true} onChange={e => setRow(s => ({ ...s, published: e.target.checked }))} />
          <span>Published (live on the public site)</span>
        </label>

        {err && <div className="form__error">{err}</div>}

        <div className="form__actions">
          <Link to="/articles" className="btn btn--ghost">Cancel</Link>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : (isNew ? 'Create article' : 'Save changes')}
          </button>
        </div>
      </form>
    </div>
  )
}
