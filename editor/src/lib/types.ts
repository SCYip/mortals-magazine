export type Genre = 'nonfiction' | 'fiction-prose' | 'fiction-poetry' | 'review' | 'other'

export interface ArticleRow {
  id: number
  slug: string
  title: string
  author: string
  author_affiliation: string | null
  date_label: string
  genre: Genre
  excerpt: string
  content: string
  image_url: string | null
  column_slug: string | null
  tags: string[] | null
  published: boolean
  published_at: string
  created_at: string
  updated_at: string
}

export interface ColumnRow {
  slug: string
  name: string
  tagline: string
  description: string
  image_url: string
  color: string
  sort_order: number
}

export interface VolumeRow {
  slug: string
  title: string
  season: string
  year: string
  theme: string
  image_url: string
  sort_order: number
}

export interface IssueRow {
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

export interface HeroSlideRow {
  id: number
  image_url: string
  alt_text: string
  sort_order: number
  active: boolean
}

export interface TeamMemberRow {
  id: number
  name: string
  role: string
  class_year: string | null
  school: string | null
  portrait_url: string | null
  bio: string | null
  sort_order: number
  active: boolean
}

export interface AlumRow {
  id: number
  name: string
  role: string
  class_year: string | null
  school: string | null
  portrait_url: string | null
  note: string | null
  sort_order: number
}

export interface AckRow {
  id: number
  name: string
  role: string
  note: string | null
  sort_order: number
}
