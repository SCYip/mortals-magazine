/**
 * scripts/import-from-mortalsmag.ts
 *
 * One-shot importer: pulls article content from mortalsmag.com for the
 * pieces we know are missing, parses their JSON-LD blocks, and inserts
 * them into Supabase with the right column assignments. Idempotent —
 * upserts on slug so re-running is safe.
 *
 * Run:
 *   SUPABASE_URL=https://datercxlvabgiieqqucr.supabase.co \
 *   SUPABASE_SERVICE_ROLE=sb_secret_xxx \
 *   npx tsx scripts/import-from-mortalsmag.ts
 *
 * Source mapping is hand-curated from the page-1 scrapes of each
 * column page on mortalsmag.com. The /post slug is what Wix uses; the
 * `slug` we insert is our own short slug used in the URL routing.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? ''
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type Genre = 'nonfiction' | 'fiction-prose' | 'fiction-poetry' | 'review' | 'other'

interface ImportItem {
  /** Wix slug (used to fetch the /post page). */
  wixSlug: string
  /** Our slug for routing on this site. */
  slug: string
  /** Display title (overrides the JSON-LD headline if present). */
  title?: string
  genre: Genre
  /** Columns this piece should live in. */
  columns: string[]
  /** Override author when JSON-LD has the wrong one. */
  authorOverride?: string
  /** Override date label when we want something specific. */
  dateOverride?: string
}

// Hand-curated from page-1 scrapes of the live column pages on
// mortalsmag.com. Inkmagination + Fourteenlines page-1 articles are
// already in the DB and got cross-linked in migration 002.
const ITEMS: ImportItem[] = [
  // --- ASTRONOMICAL ASTONISHMENT ---
  {
    wixSlug: 'heavy-lungs-behind-bars-and-a-locked-door',
    slug: 'heavy-lungs-behind-bars',
    title: 'Heavy Lungs Behind Bars and a Locked Door',
    genre: 'fiction-poetry',
    columns: ['astronomical'],
  },
  {
    wixSlug: 'the-edge-of-time',
    slug: 'the-edge-of-time',
    title: 'The Edge of Time',
    genre: 'fiction-poetry',
    columns: ['astronomical'],
  },
  {
    wixSlug: 'the-shadow-of-me',
    slug: 'the-shadow-of-me',
    title: 'The Shadow of Me',
    genre: 'fiction-poetry',
    columns: ['astronomical'],
  },
  {
    wixSlug: 'color-of-darkness',
    slug: 'color-of-darkness',
    title: 'Color of Darkness',
    genre: 'fiction-poetry',
    columns: ['astronomical'],
  },
  {
    wixSlug: 'light',
    slug: 'light',
    title: 'Light',
    genre: 'fiction-poetry',
    columns: ['astronomical'],
  },
  {
    wixSlug: 'f-r-a-c-t-u-r-e-d',
    slug: 'fractured',
    title: 'F R A C T U R E D',
    genre: 'fiction-prose',
    columns: ['astronomical'],
  },
  {
    wixSlug: 'wounds-for-stars',
    slug: 'wounds-for-stars',
    title: 'Wounds for Stars',
    genre: 'fiction-prose',
    columns: ['astronomical'],
  },

  // --- WHALE DONE ---
  {
    wixSlug: 'taxing-women-for-being-women',
    slug: 'taxing-women',
    title: 'Taxing Women For Being Women',
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'femininity-fails-females-a-review-of-the-feminine-mystique-and-why-havethere-been-no-great-female-ar',
    slug: 'femininity-fails-females',
    title: 'Femininity Fails Females — A Review of The Feminine Mystique',
    genre: 'review',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'it-takes-two-combatting-climate-change-with-government-and-people',
    slug: 'it-takes-two',
    title: 'It Takes Two — Combatting Climate Change with Government and People',
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'how-can-ai-videos-change-the-f-i-lm-industry',
    slug: 'ai-videos-film-industry',
    title: 'How Can AI Videos Change the Film Industry?',
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'chatgpt-the-mastermind-that-marks-a-brand-new-era',
    slug: 'chatgpt-mastermind',
    title: 'ChatGPT: The Mastermind That Marks a Brand-New Era',
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'carefree-boundaries-a-discussion-on-fun-v-s-safety',
    slug: 'carefree-boundaries',
    title: 'Carefree Boundaries — A Discussion on "Fun" vs. "Safety"',
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'nations-and-nationalistic-symbols',
    slug: 'nations-and-nationalistic-symbols',
    title: 'Nations and Nationalistic Symbols',
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
  {
    wixSlug: 'hotdog-eating-contest-vermont-s-devastating-floods',
    slug: 'hotdog-eating-contest',
    title: "Hotdog-Eating Contest & Vermont's Devastating Floods",
    genre: 'nonfiction',
    columns: ['whale-done'],
  },
]

interface JsonLdPost {
  '@type': string
  headline?: string
  author?: { '@type': string; name: string }
  datePublished?: string
  description?: string
  image?: string | { url?: string }
}

async function fetchJsonLd(wixSlug: string): Promise<JsonLdPost | null> {
  const url = `https://www.mortalsmag.com/post/${wixSlug}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) {
    console.warn(`  ✗ HTTP ${res.status} for ${wixSlug}`)
    return null
  }
  const html = await res.text()
  const blocks = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/g)]
  for (const b of blocks) {
    try {
      const obj = JSON.parse(b[1])
      if (obj['@type'] === 'BlogPosting' || obj['@type'] === 'Article') return obj
    } catch {
      // ignore parse errors
    }
  }
  return null
}

function formatDateLabel(iso: string | undefined): string {
  if (!iso) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function makeExcerpt(text: string, max = 240): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}

async function run() {
  console.log(`\nImporting ${ITEMS.length} articles → ${SUPABASE_URL}\n`)

  for (const item of ITEMS) {
    process.stdout.write(`• ${item.slug.padEnd(34)} `)
    const ld = await fetchJsonLd(item.wixSlug)
    if (!ld) { console.log('SKIP (no JSON-LD)'); continue }

    const title = item.title ?? ld.headline ?? item.slug
    const author = item.authorOverride ?? ld.author?.name ?? 'The Mortals Staff'
    const content = (ld.description ?? '').trim()
    if (!content) { console.log('SKIP (empty content)'); continue }

    const imageUrl = typeof ld.image === 'string' ? ld.image : ld.image?.url ?? null

    const payload = {
      slug: item.slug,
      title: title.trim(),
      author,
      date_label: item.dateOverride ?? formatDateLabel(ld.datePublished),
      genre: item.genre,
      excerpt: makeExcerpt(content),
      content,
      image_url: imageUrl,
      column_slug: item.columns[0] ?? null, // legacy field
      tags: [],
      published: true,
      published_at: ld.datePublished ?? new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('articles')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single()
    if (error) { console.log(`ERR  ${error.message}`); continue }

    // Sync junction links: delete existing for this article, re-insert.
    await supabase.from('article_columns').delete().eq('article_id', data!.id)
    if (item.columns.length > 0) {
      const linkRows = item.columns.map((c) => ({ article_id: data!.id, column_slug: c }))
      const { error: lerr } = await supabase.from('article_columns').insert(linkRows)
      if (lerr) { console.log(`ERR-link ${lerr.message}`); continue }
    }
    console.log(`OK  id=${data!.id}  cols=${item.columns.join(',')}`)
  }

  console.log('\n✓ Import done.\n')
}

run().catch((err) => {
  console.error('\n✗ Import failed:', err)
  process.exit(1)
})
