/**
 * React hooks that wrap the async API in src/data/api.ts.
 * Each hook returns { data, loading } and re-fetches when its inputs change.
 */
import { useEffect, useState } from 'react'
import type { Article, Column, Volume } from './articles'
import {
  getArticles, getArticleBySlug, getColumns, getVolumes,
  getHeroSlides, getTeam, getAlumni,
  type HeroSlide, type TeamMember, type Alum,
} from './api'

export function useArticles() {
  const [data, setData] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getArticles().then(d => { if (alive) setData(d) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { articles: data, loading }
}

export function useArticle(slug: string | undefined) {
  const [data, setData] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!slug) { setData(null); setLoading(false); return }
    let alive = true
    setLoading(true)
    getArticleBySlug(slug)
      .then(d => { if (alive) setData(d) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [slug])
  return { article: data, loading }
}

export function useColumns() {
  const [data, setData] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getColumns().then(d => { if (alive) setData(d) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { columns: data, loading }
}

export function useVolumes() {
  const [data, setData] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getVolumes().then(d => { if (alive) setData(d) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { volumes: data, loading }
}

export function useHeroSlides() {
  const [data, setData] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getHeroSlides().then(d => { if (alive) setData(d) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { slides: data, loading }
}

export function useTeam() {
  const [data, setData] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getTeam().then(d => { if (alive) setData(d) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { team: data, loading }
}

export function useAlumni() {
  const [data, setData] = useState<Alum[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getAlumni().then(d => { if (alive) setData(d) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { alumni: data, loading }
}
