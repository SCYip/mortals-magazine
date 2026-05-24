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
const mapArticle = (r: ArticleRow): Article => ({
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
  sort_order: number
}

// ---------- Fetchers ----------
// Each fetcher falls back to the bundled static data when:
//   (a) Supabase isn't configured (no env vars), or
//   (b) the request errors, or
//   (c) the table is empty (so the site shows existing content from day one,
//       even before editors add anything via the panel).
export async function getArticles(): Promise<Article[]> {
  if (!hasSupabase || !supabase) return staticArticles
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
  if (error || !data) {
    console.warn('[api] getArticles fallback:', error?.message)
    return staticArticles
  }
  if (data.length === 0) return staticArticles
  return (data as ArticleRow[]).map(mapArticle)
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabase || !supabase) return staticArticles.find(a => a.slug === slug) ?? null
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) {
    console.warn('[api] getArticleBySlug fallback:', error.message)
    return staticArticles.find(a => a.slug === slug) ?? null
  }
  return data ? mapArticle(data as ArticleRow) : null
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
