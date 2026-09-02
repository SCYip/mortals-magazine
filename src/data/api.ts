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
import type { Article, Column, Volume, Issue } from './articles'

// The static seed (full article/volume texts) is only needed when
// Supabase is unreachable — load it on demand so those ~100KB of
// bundled prose stay out of the entry chunk.
const loadSeed = () => import('./articles')

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
  /** Absent on list queries (see ARTICLE_LIST_COLUMNS); present on detail. */
  content?: string
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
  content: r.content ?? '',
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

// ---------- Tiny stale-while-revalidate cache ----------
// Every page mount used to re-fetch its data from Supabase, so
// navigating Home → Articles → Home fired the same queries again and
// re-showed loading states. Results now cache at module level: repeat
// mounts resolve instantly, and a background refresh keeps content at
// most TTL out of date. Inflight promises are shared so StrictMode's
// double-mount doesn't double-fetch.
const CACHE_TTL = 2 * 60 * 1000
type CacheEntry = { value?: unknown; at: number; inflight?: Promise<unknown> }
const swrCache = new Map<string, CacheEntry>()

function swr<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = swrCache.get(key)
  const now = Date.now()
  if (hit && hit.value !== undefined) {
    if (now - hit.at > CACHE_TTL && !hit.inflight) {
      hit.inflight = fetcher()
        .then((v) => { swrCache.set(key, { value: v, at: Date.now() }); return v })
        .catch(() => { hit.inflight = undefined; return hit.value as T })
    }
    return Promise.resolve(hit.value as T)
  }
  if (hit?.inflight) return hit.inflight as Promise<T>
  const inflight = fetcher()
    .then((v) => { swrCache.set(key, { value: v, at: Date.now() }); return v })
    .catch((err) => { swrCache.delete(key); throw err })
  swrCache.set(key, { at: now, inflight })
  return inflight
}

// ---------- Backend reachability guard ----------
// A configured-but-unreachable backend used to be the worst case: the
// browser sat on the request for ~10s before the fallback below could run,
// so every data-driven page showed "Loading…" that whole time. Now each
// query races a short timer and RESOLVES — never rejects — with a
// Postgrest-shaped error, so each fetcher's existing `if (error)` branch
// serves the seed instead. A network-level failure also trips a circuit
// breaker: for the next minute callers skip Supabase entirely, so one dead
// backend can't make every subsequent page pay the timeout again.
const SUPABASE_TIMEOUT_MS = 2500
const BREAKER_COOLDOWN_MS = 60 * 1000
// A query still running after this long is probably going to fail, so start
// pulling the seed chunk down alongside it, leaving the fallback in memory by
// the time the timeout fires.
//
// Measured against the live backend from China, a healthy query returns in
// ~1.0-1.2s. An earlier 800ms threshold sat below that, so every page load
// downloaded a seed chunk it then never used. 1800ms clears real latency with
// margin while still giving the seed a head start on the 2500ms timeout.
const SEED_WARM_MS = 1800

let breakerUntil = 0
/** True while Supabase is known-unreachable; callers go straight to seed. */
const backendDown = () => Date.now() < breakerUntil

let seedWarmed = false
/** Kick off the seed import without awaiting it; import() caches the module. */
const warmSeed = () => {
  if (seedWarmed) return
  seedWarmed = true
  loadSeed().catch(() => { seedWarmed = false })
}

type QueryResult<T> = { data: T | null; error: { message: string } | null }

/**
 * Wrap a Supabase query so it can never hang or throw.
 *
 * The breaker is tripped only by a timeout or a rejected request (the
 * backend is unreachable). A query that comes back carrying a Postgrest
 * error means the backend IS reachable and answered — that's a normal
 * per-query fallback, not a reason to bypass Supabase for everything else.
 */
function q<T>(query: PromiseLike<QueryResult<T>>, label: string): Promise<QueryResult<T>> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (res: QueryResult<T>, unreachable: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(warm)
      if (unreachable) breakerUntil = Date.now() + BREAKER_COOLDOWN_MS
      resolve(res)
    }
    const warm = setTimeout(warmSeed, SEED_WARM_MS)
    const timer = setTimeout(
      () => finish(
        { data: null, error: { message: `${label} timed out after ${SUPABASE_TIMEOUT_MS}ms` } },
        true,
      ),
      SUPABASE_TIMEOUT_MS,
    )
    query.then(
      (res) => finish(res as QueryResult<T>, false),
      (err) => finish(
        { data: null, error: { message: `${label}: ${err?.message ?? String(err)}` } },
        true,
      ),
    )
  })
}

// ---------- Fetchers ----------
// Each fetcher falls back to the bundled static data when:
//   (a) Supabase isn't configured (no env vars), or the backend is
//       currently known-unreachable (circuit breaker above), or
//   (b) the request errors or times out, or
//   (c) the table is empty (so the site shows existing content from day one,
//       even before editors add anything via the panel).
export const getArticles = () => swr('articles', fetchArticles)

// List fetch deliberately EXCLUDES `content` — 50+ full article bodies
// are hundreds of KB of JSON that no card/list view ever renders. The
// article page fetches the one body it needs via getArticleBySlug.
const ARTICLE_LIST_COLUMNS =
  'id,slug,title,author,author_affiliation,date_label,genre,excerpt,image_url,column_slug,tags,published,published_at'

async function fetchArticles(): Promise<Article[]> {
  if (!hasSupabase || !supabase || backendDown()) return withStaticColumnSlugs((await loadSeed()).articles)
  // Fetch articles + their column links in parallel. We then group the
  // links by article_id and pass each group into mapArticle so every
  // returned Article carries its full columnSlugs[] array.
  const [artRes, linkRes] = await Promise.all([
    q(supabase.from('articles').select(ARTICLE_LIST_COLUMNS).eq('published', true).order('published_at', { ascending: false }), 'getArticles'),
    q(supabase.from('article_columns').select('article_id,column_slug'), 'getArticles.links'),
  ])
  if (artRes.error || !artRes.data) {
    console.warn('[api] getArticles fallback:', artRes.error?.message)
    return withStaticColumnSlugs((await loadSeed()).articles)
  }
  if (artRes.data.length === 0) return withStaticColumnSlugs((await loadSeed()).articles)
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

export const getArticleBySlug = (slug: string) =>
  swr(`article:${slug}`, () => fetchArticleBySlug(slug))

async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabase || !supabase || backendDown()) {
    const found = (await loadSeed()).articles.find(a => a.slug === slug)
    return found ? withStaticColumnSlugs([found])[0] : null
  }
  const { data, error } = await q(
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle(),
    'getArticleBySlug',
  )
  if (error) {
    console.warn('[api] getArticleBySlug fallback:', error.message)
    const found = (await loadSeed()).articles.find(a => a.slug === slug)
    return found ? withStaticColumnSlugs([found])[0] : null
  }
  if (!data) return null
  // Fetch this article's column links so the detail page knows which
  // columns it belongs to.
  const { data: linkData } = await q(
    supabase
      .from('article_columns')
      .select('column_slug')
      .eq('article_id', (data as ArticleRow).id),
    'getArticleBySlug.links',
  )
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

export const getColumns = () => swr('columns', fetchColumns)

async function fetchColumns(): Promise<Column[]> {
  if (!hasSupabase || !supabase || backendDown()) return (await loadSeed()).columns
  const { data, error } = await q(
    supabase
      .from('columns')
      .select('*')
      .order('sort_order'),
    'getColumns',
  )
  if (error || !data) {
    console.warn('[api] getColumns fallback:', error?.message)
    return (await loadSeed()).columns
  }
  if (data.length === 0) return (await loadSeed()).columns
  return (data as ColumnRow[]).map(mapColumn)
}

export const getVolumes = () => swr('volumes', fetchVolumes)

async function fetchVolumes(): Promise<Volume[]> {
  if (!hasSupabase || !supabase || backendDown()) return (await loadSeed()).volumes
  const [volsRes, issuesRes] = await Promise.all([
    q(supabase.from('volumes').select('*').order('sort_order'), 'getVolumes'),
    q(supabase.from('issues').select('*').order('sort_order'), 'getVolumes.issues'),
  ])
  if (volsRes.error || issuesRes.error) {
    console.warn('[api] getVolumes fallback:', volsRes.error?.message ?? issuesRes.error?.message)
    return (await loadSeed()).volumes
  }
  if (!volsRes.data || volsRes.data.length === 0) return (await loadSeed()).volumes
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

export const getHeroSlides = () => swr('heroSlides', fetchHeroSlides)

async function fetchHeroSlides(): Promise<HeroSlide[]> {
  if (!hasSupabase || !supabase || backendDown()) return STATIC_HERO_SLIDES
  const { data, error } = await q(
    supabase
      .from('hero_slides')
      .select('*')
      .eq('active', true)
      .order('sort_order'),
    'getHeroSlides',
  )
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

export const getTeam = () => swr('team', fetchTeam)

async function fetchTeam(): Promise<TeamMember[]> {
  if (!hasSupabase || !supabase || backendDown()) return []
  const { data, error } = await q(
    supabase
      .from('team_members')
      .select('*')
      .eq('active', true)
      .order('sort_order'),
    'getTeam',
  )
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

export const getAlumni = () => swr('alumni', fetchAlumni)

async function fetchAlumni(): Promise<Alum[]> {
  if (!hasSupabase || !supabase || backendDown()) return []
  const { data, error } = await q(
    supabase
      .from('alumni')
      .select('*')
      .order('sort_order'),
    'getAlumni',
  )
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

export const getAcknowledgements = () => swr('acknowledgements', fetchAcknowledgements)

async function fetchAcknowledgements(): Promise<Ack[]> {
  if (!hasSupabase || !supabase || backendDown()) return STATIC_ACKS
  const { data, error } = await q(
    supabase
      .from('acknowledgements')
      .select('*')
      .order('sort_order'),
    'getAcknowledgements',
  )
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

// ---------- Leaders ----------
// The leadership roster (see migration 005). Kept separate from TeamMember
// and Alum on purpose: a leader is a distinct role from a board member or a
// past contributor, so the same person can appear here as a former chief
// without being duplicated into the editorial board.
export interface Leader {
  id: number
  name: string
  role: string
  /** University a former leader went on to. Null for current leaders. */
  college: string | null
  former: boolean
  sortOrder: number
}

type LeaderRow = {
  id: number
  name: string
  role: string
  college: string | null
  former: boolean
  sort_order: number
}

const mapLeader = (r: LeaderRow): Leader => ({
  id: r.id,
  name: r.name,
  role: r.role,
  college: r.college,
  former: r.former,
  sortOrder: r.sort_order,
})

// Bundled fallback so the roster still renders when the backend is paused —
// the same failure that blanked the team and alumni sections before.
const STATIC_LEADERS: Leader[] = [
  { id: 1,  name: 'David Cheng', role: 'Editor in Chief',        college: null,         former: false, sortOrder: 0 },
  { id: 2,  name: 'Alex Huang',  role: 'Editor in Chief',        college: null,         former: false, sortOrder: 1 },
  { id: 3,  name: 'David Zhu',   role: 'Lead Website Developer', college: null,         former: false, sortOrder: 2 },
  { id: 4,  name: 'Joey Yip',    role: 'Lead Website Developer', college: null,         former: false, sortOrder: 3 },
  { id: 5,  name: 'Morning Lu',  role: 'HR Manager',             college: null,         former: false, sortOrder: 4 },
  { id: 6,  name: 'Katie Lam',   role: 'Design Head',            college: null,         former: false, sortOrder: 5 },
  { id: 7,  name: 'Sherry You',  role: 'Design Head',            college: null,         former: false, sortOrder: 6 },
  { id: 8,  name: 'Timmy Zhang', role: 'Editor in Chief',        college: 'Stanford',   former: true,  sortOrder: 0 },
  { id: 9,  name: 'Albert Wang', role: 'Editor in Chief',        college: 'Stanford',   former: true,  sortOrder: 1 },
  { id: 10, name: 'Connie Xu',   role: 'Design Head',            college: 'Swarthmore', former: true,  sortOrder: 2 },
  { id: 11, name: 'Susan He',    role: 'Design Head',            college: 'Cambridge',  former: true,  sortOrder: 3 },
  { id: 12, name: 'Cindy Tian',  role: 'Publicity Head',         college: 'Grinnell',   former: true,  sortOrder: 4 },
  { id: 13, name: 'Johnny Li',   role: 'Lead Website Developer', college: 'WashU',      former: true,  sortOrder: 5 },
]

export const getLeaders = () => swr('leaders', fetchLeaders)

async function fetchLeaders(): Promise<Leader[]> {
  if (!hasSupabase || !supabase || backendDown()) return STATIC_LEADERS
  const { data, error } = await q(
    supabase
      .from('leaders')
      .select('*')
      .order('former')
      .order('sort_order'),
    'getLeaders',
  )
  if (error || !data || data.length === 0) {
    if (error) console.warn('[api] getLeaders fallback:', error.message)
    return STATIC_LEADERS
  }
  return (data as LeaderRow[]).map(mapLeader)
}
