import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, X, Plus, Save, RotateCcw, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { runQuery } from '../lib/query'
import type { ArticleRow } from '../lib/types'
import { useTabRefocus } from '../lib/useTabRefocus'
import { resolveImageUrl } from '../components/ImageStrip'

/** The rail on the home page has exactly this many slots. */
export const MAX_PICKS = 5

type PickRow = Pick<ArticleRow, 'id' | 'slug' | 'title' | 'author' | 'date_label' | 'genre' | 'image_url' | 'pick_order'>
const COLS = 'id,slug,title,author,date_label,genre,image_url,pick_order'

/**
 * Curate the home page "Editor's Picks" rail.
 *
 * Left: the current picks in rail order — reorder with the arrows, drop
 * with ✕. Right: every other published article, searchable, with an Add
 * button that's disabled once the rail is full. Nothing touches the
 * database until Save, which writes the whole set in one go: clear every
 * slot, then assign 1..n. That keeps the stored state consistent even if
 * two editors race, at the cost of last-writer-wins.
 */
export default function PicksPanel() {
  const [all, setAll] = useState<PickRow[]>([])
  const [picks, setPicks] = useState<PickRow[]>([])       // working copy, rail order
  const [savedIds, setSavedIds] = useState<number[]>([])  // what's in the DB, for dirty check
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const refetch = async () => {
    setLoadError(null)
    try {
      const { data, error } = await runQuery(() => supabase
        .from('articles')
        .select(COLS)
        .eq('published', true)
        .order('published_at', { ascending: false }))
      if (error) throw error
      const rows = (data as PickRow[]) ?? []
      setAll(rows)
      const current = rows
        .filter(r => r.pick_order != null)
        .sort((a, b) => (a.pick_order! - b.pick_order!))
        .slice(0, MAX_PICKS)
      setPicks(current)
      setSavedIds(current.map(r => r.id))
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load articles')
    }
  }
  useEffect(() => { refetch() }, [])

  const pickIds = useMemo(() => new Set(picks.map(p => p.id)), [picks])
  const dirty = picks.length !== savedIds.length || picks.some((p, i) => p.id !== savedIds[i])

  // Only refresh from the server on refocus if there's nothing unsaved —
  // otherwise a tab switch would silently throw away the editor's work.
  useTabRefocus(() => { if (!dirty) refetch() })

  const pool = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all.filter(r => !pickIds.has(r.id) && (
      !needle || r.title.toLowerCase().includes(needle) || r.author.toLowerCase().includes(needle)
    ))
  }, [all, pickIds, q])

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= picks.length) return
    const next = [...picks]; [next[i], next[j]] = [next[j], next[i]]
    setPicks(next)
  }
  const remove = (id: number) => setPicks(picks.filter(p => p.id !== id))
  const add = (r: PickRow) => { if (picks.length < MAX_PICKS) setPicks([...picks, r]) }
  const reset = () => setPicks(all.filter(r => savedIds.includes(r.id)).sort((a, b) => savedIds.indexOf(a.id) - savedIds.indexOf(b.id)))

  const save = async () => {
    setBusy(true); setFlash(null)
    try {
      // 1. Clear every slot. 2. Assign 1..n. Two statements, but the second
      //    only ever adds — a failure between them leaves an empty rail (the
      //    home page then falls back to the newest five), never a broken one.
      const clear = await supabase.from('articles').update({ pick_order: null }).not('pick_order', 'is', null)
      if (clear.error) throw clear.error
      const writes = await Promise.all(
        picks.map((p, i) => supabase.from('articles').update({ pick_order: i + 1 }).eq('id', p.id)),
      )
      const failed = writes.find(w => w.error)
      if (failed?.error) throw failed.error
      setSavedIds(picks.map(p => p.id))
      setFlash({ kind: 'ok', text: `Saved. The home page rail now shows ${picks.length} pick${picks.length === 1 ? '' : 's'}.` })
    } catch (e: any) {
      setFlash({ kind: 'err', text: e?.message ?? 'Save failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <div>
          <h1 className="panel__title">Editor's Picks</h1>
          <p className="panel__sub">
            The five-slot rail on the home page. Order here is the order readers see.
            {picks.length === 0 && ' With no picks chosen, the rail shows the five newest articles.'}
          </p>
        </div>
        <div className="picks__head-actions">
          {dirty && <button className="btn btn--ghost" onClick={reset} disabled={busy}><RotateCcw size={14} /> Discard</button>}
          <button className="btn btn--primary" onClick={save} disabled={busy || !dirty}>
            <Save size={14} /> {busy ? 'Saving…' : dirty ? 'Save picks' : 'Saved'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flash flash--err">{loadError} · <button className="link-btn" onClick={refetch}>Retry</button></div>
      )}
      {flash && <div className={`flash flash--${flash.kind}`}>{flash.text}</div>}

      <div className="picks">
        <section className="picks__col">
          <h2 className="panel__group-title">On the rail · {picks.length} / {MAX_PICKS}</h2>
          {picks.length === 0 && <p className="panel__loading">Nothing picked yet — add from the right.</p>}
          <ol className="picks__list">
            {picks.map((p, i) => (
              <li key={p.id} className="picks__slot">
                <span className="picks__slot-num">{i + 1}</span>
                <div className="picks__thumb">{p.image_url ? <img src={resolveImageUrl(p.image_url)} alt="" /> : <Sparkles size={16} />}</div>
                <div className="picks__meta">
                  <div className="card__title">{p.title}</div>
                  <div className="card__meta">{p.author} · {p.date_label}</div>
                </div>
                <div className="picks__slot-actions">
                  <button className="icon-btn" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
                  <button className="icon-btn" title="Move down" onClick={() => move(i, 1)} disabled={i === picks.length - 1}><ArrowDown size={14} /></button>
                  <button className="icon-btn icon-btn--danger" title="Remove from picks" onClick={() => remove(p.id)}><X size={14} /></button>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="picks__col">
          <h2 className="panel__group-title">Add an article</h2>
          <input
            className="picks__search"
            placeholder="Search published articles by title or author…"
            value={q} onChange={e => setQ(e.target.value)}
          />
          {picks.length >= MAX_PICKS && <p className="picks__full">The rail is full — remove one to add another.</p>}
          <ul className="picks__list picks__list--pool">
            {pool.map(r => (
              <li key={r.id} className="picks__slot picks__slot--pool">
                <div className="picks__thumb">{r.image_url ? <img src={resolveImageUrl(r.image_url)} alt="" /> : <Sparkles size={16} />}</div>
                <div className="picks__meta">
                  <div className="card__title">{r.title}</div>
                  <div className="card__meta">{r.author} · {r.date_label}</div>
                </div>
                <button className="icon-btn" title="Add to picks" onClick={() => add(r)} disabled={picks.length >= MAX_PICKS}><Plus size={14} /></button>
              </li>
            ))}
            {pool.length === 0 && !loadError && <li className="panel__loading">{q ? 'No articles match.' : 'Every published article is already on the rail.'}</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
