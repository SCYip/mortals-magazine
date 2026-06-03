/**
 * Async data layer. When Supabase is configured, fetches live from the
 * database. Otherwise falls back to the static seed in articles.ts so the
 * site keeps working with zero infrastructure.
 *
 * Pages do not need to know whether data came from Supabase or the static
 * fallback — both return the same camelCase shapes consumed by existing
 * components.
 */
import { supabase, hasSupabase } from '../lib/supabase'
import {
  articles as staticArticles,
  columns as staticColumns,
  volumes as staticVolumes,
  type Article,
  type Column,
  type Volume,
  type Issue,
} from './articles'

// ---------- New types ----------
export interface HeroSlide {
  id: number
  imageUrl: string
  altText: string
  sortOrder: number
}

export interface TeamMember {
  id: number
  name: string
  role: string
  classYear: string | null
  school: string | null
  portraitUrl: string | null
  bio: string | null
  sortOrder: number
}

export interface Alum {
  id: number
  name: string
  role: string
  classYear: string | null
  school: string | null
  portraitUrl: string | null
  note: string | null
  sortOrder: number
}

export interface Ack {
  id: number
  name: string
  role: string
  note: string
  sortOrder: number
}

// ---------- Row → camelCase mappers ----------
type ArticleRow = {
  id: number
  slug: string
  title: string
  author: string
  author_affiliation: string | null
  date_label: string
  genre: Article['genre']
  excerpt: string
  content: string
  image_url: string | null
  column_slug: string | null
  tags: string[] | null
  published: boolean
  published_at: string
}
const mapArticle = (r: ArticleRow, columnSlugs?: string[]): Article => ({
  id: String(r.id),
  slug: r.slug,
  title: r.title,
  author: r.author,
  authorAffiliation: r.author_affiliation ?? undefined,
  date: r.date_label,
  genre: r.genre,
  excerpt: r.excerpt,
  content: r.content,
  imageUrl: r.image_url ?? undefined,
  columnSlug: r.column_slug ?? undefined,
  // Source of truth for column membership is the junction. If callers
  // didn't pass any links, fall back to the legacy single-column field
  // so the article still shows up on its column page.
  columnSlugs: columnSlugs && columnSlugs.length > 0
    ? columnSlugs
    : (r.column_slug ? [r.column_slug] : []),
  tags: r.tags ?? undefined,
})

type ColumnRow = {
  slug: string
  name: string
  tagline: string
  description: string
  image_url: string
  color: string
  sort_order: number
}
const mapColumn = (r: ColumnRow): Column => ({
  slug: r.slug,
  name: r.name,
  tagline: r.tagline,
  description: r.description,
  imageUrl: r.image_url,
  color: r.color,
})

type VolumeRow = {
  slug: string
  title: string
  season: string
  year: string
  theme: string
  image_url: string
  sort_order: number
}
type IssueRow = {
  slug: string
  volume_slug: string
  title: string
  season: string
  year: string
  quote: string
  quote_author: string
  content: string
  pdf_url: string | null
  sort_order: number
}

// ---------- Fetchers ----------
// Each fetcher falls back to the bundled static data when:
//   (a) Supabase isn't configured (no env vars), or
//   (b) the request errors, or
//   (c) the table is empty (so the site shows existing content from day one,
//       even before editors add anything via the panel).
export async function getArticles(): Promise<Article[]> {
  if (!hasSupabase || !supabase) return withStaticColumnSlugs(staticArticles)
  // Fetch articles + their column links in parallel. We then group the
  // links by article_id and pass each group into mapArticle so every
  // returned Article carries its full columnSlugs[] array.
  const [artRes, linkRes] = await Promise.all([
    supabase.from('articles').select('*').eq('published', true).order('published_at', { ascending: false }),
    supabase.from('article_columns').select('article_id,column_slug'),
  ])
  if (artRes.error || !artRes.data) {
    console.warn('[api] getArticles fallback:', artRes.error?.message)
    return withStaticColumnSlugs(staticArticles)
  }
  if (artRes.data.length === 0) return withStaticColumnSlugs(staticArticles)
  const linksByArticle = new Map<number, string[]>()
  for (const l of (linkRes.data ?? []) as Array<{ article_id: number; column_slug: string }>) {
    const list = linksByArticle.get(l.article_id) ?? []
    list.push(l.column_slug)
    linksByArticle.set(l.article_id, list)
  }
  return (artRes.data as ArticleRow[]).map((r) =>
    mapArticle(r, linksByArticle.get(r.id)),
  )
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabase || !supabase) {
    const found = staticArticles.find(a => a.slug === slug)
    return found ? withStaticColumnSlugs([found])[0] : null
  }
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) {
    console.warn('[api] getArticleBySlug fallback:', error.message)
    const found = staticArticles.find(a => a.slug === slug)
    return found ? withStaticColumnSlugs([found])[0] : null
  }
  if (!data) return null
  // Fetch this article's column links so the detail page knows which
  // columns it belongs to.
  const { data: linkData } = await supabase
    .from('article_columns')
    .select('column_slug')
    .eq('article_id', (data as ArticleRow).id)
  const slugs = (linkData ?? []).map((l: { column_slug: string }) => l.column_slug)
  return mapArticle(data as ArticleRow, slugs)
}

// Hydrate the static Article[] (which only has the legacy `columnSlug`
// field) with the multi-column `columnSlugs` array for parity with the
// Supabase code path. Used whenever we fall back to the static seed.
function withStaticColumnSlugs(list: Article[]): Article[] {
  return list.map((a) => ({
    ...a,
    columnSlugs: a.columnSlugs && a.columnSlugs.length > 0
      ? a.columnSlugs
      : (a.columnSlug ? [a.columnSlug] : []),
  }))
}

export async function getColumns(): Promise<Column[]> {
  if (!hasSupabase || !supabase) return staticColumns
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .order('sort_order')
  if (error || !data) {
    console.warn('[api] getColumns fallback:', error?.message)
    return staticColumns
  }
  if (data.length === 0) return staticColumns
  return (data as ColumnRow[]).map(mapColumn)
}

export async function getVolumes(): Promise<Volume[]> {
  if (!hasSupabase || !supabase) return staticVolumes
  const [volsRes, issuesRes] = await Promise.all([
    supabase.from('volumes').select('*').order('sort_order'),
    supabase.from('issues').select('*').order('sort_order'),
  ])
  if (volsRes.error || issuesRes.error) {
    console.warn('[api] getVolumes fallback:', volsRes.error?.message ?? issuesRes.error?.message)
    return staticVolumes
  }
  if (!volsRes.data || volsRes.data.length === 0) return staticVolumes
  const issuesByVol = new Map<string, Issue[]>()
  for (const r of (issuesRes.data ?? []) as IssueRow[]) {
    const i: Issue = {
      slug: r.slug,
      title: r.title,
      season: r.season,
      year: r.year,
      quote: r.quote,
      quoteAuthor: r.quote_author,
      content: r.content,
      pdfUrl: r.pdf_url ?? undefined,
    }
    const list = issuesByVol.get(r.volume_slug) ?? []
    list.push(i)
    issuesByVol.set(r.volume_slug, list)
  }
  return (volsRes.data as VolumeRow[]).map((r): Volume => ({
    slug: r.slug,
    title: r.title,
    season: r.season,
    year: r.year,
    theme: r.theme,
    imageUrl: r.image_url,
    issues: issuesByVol.get(r.slug) ?? [],
  }))
}

// Sourced from the live mortalsmag.com slideshow widget (comp-m9e5w0cn)
// in slide-rotation order — re-scraped via Chrome on 2026-05-24.
const STATIC_HERO_SLIDES: HeroSlide[] = [
  { id: 1, imageUrl: '/images/hero_slide_1.jpg', altText: '', sortOrder: 0 },
  { id: 2, imageUrl: '/images/hero_slide_2.jpg', altText: '', sortOrder: 1 },
  { id: 3, imageUrl: '/images/hero_slide_3.jpg', altText: '', sortOrder: 2 },
  { id: 4, imageUrl: '/images/hero_slide_4.jpg', altText: '', sortOrder: 3 },
  { id: 5, imageUrl: '/images/hero_slide_5.jpg', altText: '', sortOrder: 4 },
]

export async function getHeroSlides(): Promise<HeroSlide[]> {
  if (!hasSupabase || !supabase) return STATIC_HERO_SLIDES
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error || !data || data.length === 0) {
    if (error) console.warn('[api] getHeroSlides fallback:', error.message)
    return STATIC_HERO_SLIDES
  }
  return data.map((r: any) => ({
    id: r.id,
    imageUrl: r.image_url,
    altText: r.alt_text ?? '',
    sortOrder: r.sort_order,
  }))
}

export async function getTeam(): Promise<TeamMember[]> {
  if (!hasSupabase || !supabase) return []
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error || !data) return []
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    classYear: r.class_year,
    school: r.school,
    portraitUrl: r.portrait_url,
    bio: r.bio,
    sortOrder: r.sort_order,
  }))
}

export async function getAlumni(): Promise<Alum[]> {
  if (!hasSupabase || !supabase) return []
  const { data, error } = await supabase
    .from('alumni')
    .select('*')
    .order('sort_order')
  if (error || !data) return []
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    classYear: r.class_year,
    school: r.school,
    portraitUrl: r.portrait_url,
    note: r.note,
    sortOrder: r.sort_order,
  }))
}

// Faculty + staff acknowledgements shown on the About page. Falls back
// to a bundled list so the section is never empty even before Supabase
// is reachable or seeded.
const STATIC_ACKS: Ack[] = [
  { id: 1, name: 'Mr. Dust',     role: 'Advisor & Mentor',               note: 'Improving our ideas with concrete actions and constructive feedback', sortOrder: 0 },
  { id: 2, name: 'Mr. Huizinga', role: 'Proofreader',                    note: 'Proofreading our drafts from start to end; mentor to all three student magazine editors', sortOrder: 1 },
  { id: 3, name: 'Mr. Quirk',    role: 'Head of BIPH & AP Literature',   note: 'Leading us to the publishing stage with unwavering support', sortOrder: 2 },
  { id: 4, name: 'Ms. Hannah',   role: 'English Department',             note: 'Championing the literary community at BASIS', sortOrder: 3 },
  { id: 5, name: 'Ms. Victoria', role: 'Club Advisor',                   note: 'Guiding The Mortals as our club advisor and steady source of support', sortOrder: 4 },
  { id: 6, name: 'Mr. Ken',      role: 'Head of Operations',             note: 'Head of Operations at our school — the person who prints every issue for us', sortOrder: 5 },
  { id: 7, name: 'Mr. Slonim',   role: 'Head of English, BASIS Network', note: 'Head of English for the BASIS network, championing student writing across campuses', sortOrder: 6 },
]

export async function getAcknowledgements(): Promise<Ack[]> {
  if (!hasSupabase || !supabase) return STATIC_ACKS
  const { data, error } = await supabase
    .from('acknowledgements')
    .select('*')
    .order('sort_order')
  if (error || !data || data.length === 0) {
    if (error) console.warn('[api] getAcknowledgements fallback:', error.message)
    return STATIC_ACKS
  }
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    note: r.note ?? '',
    sortOrder: r.sort_order,
  }))
}
