/**
 * scripts/import-articles-full.ts
 *
 * Full-content importer. Reads a scraped articles.json (produced from
 * mortalsmag.com — full post bodies + category labels) and syncs it into
 * Supabase:
 *   - Refreshes EXISTING articles' content only when the scraped body is
 *     meaningfully longer than what's stored (catches the truncated
 *     500-char JSON-LD imports from a previous pass) — never clobbers a
 *     good longer body with a shorter one.
 *   - Inserts NEW articles with a best-effort author heuristic.
 *   - Rebuilds each article's article_columns links from the live
 *     category tags.
 *
 * Run:
 *   ARTICLES_JSON=/tmp/mortals-scrape/articles.json \
 *   SUPABASE_URL=https://datercxlvabgiieqqucr.supabase.co \
 *   SUPABASE_SERVICE_ROLE=sb_secret_xxx \
 *   npx tsx scripts/import-articles-full.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? ''
const ARTICLES_JSON = process.env.ARTICLES_JSON ?? '/tmp/mortals-scrape/articles.json'
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type Genre = 'nonfiction' | 'fiction-prose' | 'fiction-poetry' | 'review' | 'other'

interface Scraped {
  wixSlug: string
  title: string
  genre: Genre
  columns: string[]   // unused (recomputed from rawCats below)
  rawCats: string[]
  body: string
}

// Wix posts that are NOT column articles — announcements + issue landings.
const SKIP_WIX = new Set([
  'the-mortals-magazine-summer-and-fall-2024',
  'winter-2024-2025',
  'announcing-the-mortals-magazine',
  'narrative-the-enlightened', // issue/theme intro, not a standalone piece
])
// Wix duplicate posts (same content posted twice) — keep the base slug.
const SKIP_DUPES = new Set([
  'the-edge-of-time-1',
  'the-shadow-of-me-1',
  'lost-memories-1',
  'the-world-s-paradox-1',
])

// Existing DB slugs whose Wix slug differs — refresh these instead of
// creating a duplicate.
const WIX_TO_OUR: Record<string, string> = {
  'the-exorbitant-price-of-cheap-clothes-fast-fashion-s-humanitarian-and-environmental-implications': 'exorbitant-price-of-cheap-clothes',
  'most-beautiful-in-its-erasure-washington-s-speech-and-commoner-s-diary': 'most-beautiful-in-its-erasure',
  '_rain': 'rain',
  'who-am-i-to-saythe-yeti-david-cheng-biph': 'the-yeti',
  'is-that-a-mirror-no-silly-it-s-just-you': 'is-that-a-mirror',
  'do-we-really-have-free-will-in-a-world-governed-by-laws-of-physics': 'free-will-laws-of-physics',
  'bringing-pothos-to-light': 'womens-day-speech',
  'interview-with-basis-plh-student-council-president': 'interview-student-council-president',
  'heavy-lungs-behind-bars-and-a-locked-door': 'heavy-lungs-behind-bars',
  'f-r-a-c-t-u-r-e-d': 'fractured',
  'taxing-women-for-being-women': 'taxing-women',
  'femininity-fails-females-a-review-of-the-feminine-mystique-and-why-havethere-been-no-great-female-ar': 'femininity-fails-females',
  'it-takes-two-combatting-climate-change-with-government-and-people': 'it-takes-two',
  'how-can-ai-videos-change-the-f-i-lm-industry': 'ai-videos-film-industry',
  'chatgpt-the-mastermind-that-marks-a-brand-new-era': 'chatgpt-mastermind',
  'carefree-boundaries-a-discussion-on-fun-v-s-safety': 'carefree-boundaries',
  'hotdog-eating-contest-vermont-s-devastating-floods': 'hotdog-eating-contest',
}

const GENRE_FROM_LABEL: Record<string, Genre> = {
  'Nonfiction': 'nonfiction',
  'Fiction-Prose': 'fiction-prose',
  'Fiction-Poetry': 'fiction-poetry',
  'Book/Movie Review': 'review',
  'Book/Movie/Game Review': 'review',
  'Other': 'other',
}
const COLUMN_FROM_LABEL: Record<string, string> = {
  'Inkmagination': 'inkmagination',
  'Astronomical Astonishment': 'astronomical',
  'Whale Done': 'whale-done',
  'Conscious Closet': 'whale-done',
}

function slugify(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function titleCaseIfShouting(t: string): string {
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length > 0 && letters === letters.toUpperCase()) {
    return t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return t
}

// Best-effort author from the first few body lines (e.g. "Name, BIPH").
function guessAuthor(body: string): string {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4)
  for (const ln of lines) {
    if (ln.length <= 50 && /(BIPH|BIGZ|BIBWH|BASIS)/i.test(ln)) {
      return ln.replace(/^[—\-\s]+/, '').trim()
    }
  }
  return 'The Mortals'
}

function makeExcerpt(body: string, title: string, max = 220): string {
  // Skip a leading line that just repeats the title.
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)
  const start = lines[0] && lines[0].toLowerCase() === title.toLowerCase() ? 1 : 0
  const text = lines.slice(start).join(' ')
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const sp = cut.lastIndexOf(' ')
  return (sp > 0 ? cut.slice(0, sp) : cut) + '…'
}

function deriveColumns(rawCats: string[], genre: Genre): string[] {
  const cols = new Set<string>()
  for (const c of rawCats) {
    const mapped = COLUMN_FROM_LABEL[c]
    if (mapped) cols.add(mapped)
  }
  // Poetry that lives in Inkmagination also appears in the Fourteenlines
  // poetry view on the live site.
  if (genre === 'fiction-poetry' && cols.has('inkmagination')) cols.add('fourteenlines')
  return [...cols]
}

async function run() {
  const all: Scraped[] = JSON.parse(readFileSync(ARTICLES_JSON, 'utf-8'))
  const items = all.filter(
    (a) => !SKIP_WIX.has(a.wixSlug) && !SKIP_DUPES.has(a.wixSlug) && a.body.trim().length >= 60,
  )
  console.log(`\n${all.length} scraped → ${items.length} importable (after skips)\n`)

  // Snapshot existing articles for refresh decisions.
  const { data: existing } = await supabase.from('articles').select('id,slug,content')
  const bySlug = new Map<string, { id: number; len: number }>()
  for (const r of (existing ?? []) as Array<{ id: number; slug: string; content: string }>) {
    bySlug.set(r.slug, { id: r.id, len: (r.content ?? '').length })
  }

  let inserted = 0, refreshed = 0, genreOnly = 0, linked = 0
  for (const a of items) {
    const ourSlug = WIX_TO_OUR[a.wixSlug] ?? slugify(a.wixSlug)
    const genreLabel = a.rawCats.find((c) => GENRE_FROM_LABEL[c])
    const genre: Genre = genreLabel ? GENRE_FROM_LABEL[genreLabel] : (a.genre || 'other')
    const columns = deriveColumns(a.rawCats, genre)
    const body = a.body.trim()
    const existingRow = bySlug.get(ourSlug)

    let articleId: number
    let action: string
    if (existingRow) {
      // Refresh content only when the scrape is at least 10% longer
      // (catches truncated imports; preserves good longer bodies).
      // Only update genre when the scrape actually carried a genre label
      // — otherwise we'd clobber a good seed genre with "other".
      const patch: Record<string, unknown> = {}
      if (genreLabel) patch.genre = genre
      if (body.length > existingRow.len * 1.1) {
        patch.content = body
        patch.excerpt = makeExcerpt(body, a.title)
        refreshed++; action = 'REFRESH'
      } else {
        genreOnly++; action = 'genre  '
      }
      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from('articles').update(patch).eq('id', existingRow.id)
        if (error) { console.log(`  ERR update ${ourSlug}: ${error.message}`); continue }
      }
      articleId = existingRow.id
    } else {
      const title = titleCaseIfShouting(a.title)
      const { data, error } = await supabase.from('articles').insert({
        slug: ourSlug,
        title,
        author: guessAuthor(body),
        date_label: 'Jan 25, 2025',
        genre,
        excerpt: makeExcerpt(body, title),
        content: body,
        image_url: null,
        column_slug: columns[0] ?? null,
        tags: [],
        published: true,
      }).select('id').single()
      if (error) { console.log(`  ERR insert ${ourSlug}: ${error.message}`); continue }
      articleId = data!.id
      inserted++; action = 'NEW    '
    }

    // Rebuild column links from the live category tags.
    await supabase.from('article_columns').delete().eq('article_id', articleId)
    if (columns.length > 0) {
      const { error: lerr } = await supabase.from('article_columns')
        .insert(columns.map((c) => ({ article_id: articleId, column_slug: c })))
      if (lerr) { console.log(`  ERR link ${ourSlug}: ${lerr.message}`); continue }
      linked += columns.length
    }
    console.log(`  ${action} ${ourSlug.padEnd(36)} ${genre.padEnd(14)} [${columns.join(', ')}]`)
  }

  console.log(`\n✓ Done. inserted=${inserted}, content-refreshed=${refreshed}, genre-only=${genreOnly}, column-links=${linked}\n`)
}

run().catch((e) => { console.error('\n✗ Import failed:', e); process.exit(1) })
