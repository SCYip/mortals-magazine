import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useArticles } from '../data/hooks'
import ArticleCard from '../components/articles/ArticleCard'
import Reveal from '../components/ui/Reveal'
import './AllArticlesPage.css'

const GENRES = [
  { id: 'all', label: 'All' },
  { id: 'nonfiction', label: 'Nonfiction' },
  { id: 'fiction-poetry', label: 'Fiction (Poetry)' },
  { id: 'fiction-prose', label: 'Fiction (Prose)' },
  { id: 'review', label: 'Reviews' },
  { id: 'other', label: 'Other' },
]

const PAGE_SIZE = 9

export default function AllArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeGenre, setActiveGenre] = useState('all')
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [page, setPage] = useState(1)
  const { articles } = useArticles()

  // Keep URL ?q= in sync with the query so the search is shareable & survives refresh
  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (current === query) return
    const next = new URLSearchParams(searchParams)
    if (query) next.set('q', query)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  // If the user navigates here from the navbar with a fresh ?q=, sync it in
  useEffect(() => {
    const incoming = searchParams.get('q') ?? ''
    if (incoming !== query) setQuery(incoming)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter(a => {
      if (activeGenre !== 'all' && a.genre !== activeGenre) return false
      if (!q) return true
      const haystack = [
        a.title,
        a.author,
        a.authorAffiliation ?? '',
        a.excerpt,
        ...(a.tags ?? []),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [activeGenre, query, articles])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre)
    setPage(1)
  }
  const handleQueryChange = (v: string) => {
    setQuery(v)
    setPage(1)
  }

  return (
    <div className="articles-page">
      <div className="articles-page__hero">
        <div className="articles-page__hero-bg" />
        <div className="container">
          <Reveal>
            <span className="overline">The Archive</span>
            <h1>All Articles</h1>
            <p className="articles-page__hero-desc">
              Every piece of writing published in The Mortals — nonfiction, fiction, poetry, essays, and more.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="container">
        <div className="articles-page__body">
          {/* Search */}
          <Reveal>
            <div className="articles-page__toolbar">
              <label className="articles-page__search">
                <Search size={16} className="articles-page__search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="articles-page__search-input"
                  placeholder="Search by title, author, tag…"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  aria-label="Search articles"
                />
                {query && (
                  <button
                    type="button"
                    className="articles-page__search-clear"
                    onClick={() => handleQueryChange('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              <span className="articles-page__count" aria-live="polite">
                {filtered.length === articles.length
                  ? `${articles.length} pieces`
                  : `${filtered.length} of ${articles.length}`}
              </span>
            </div>
          </Reveal>

          {/* Filters */}
          <Reveal>
            <div className="articles-page__filters">
              {GENRES.map(g => (
                <button
                  key={g.id}
                  className={`articles-page__filter ${activeGenre === g.id ? 'active' : ''}`}
                  onClick={() => handleGenreChange(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Grid */}
          <div className="articles-page__grid">
            {paginated.map((article, i) => (
              <Reveal key={article.id} delay={i * 50}>
                <ArticleCard article={article} />
              </Reveal>
            ))}
          </div>

          {paginated.length === 0 && (
            <div className="articles-page__empty">
              <p>
                {query
                  ? <>No results for <em>"{query}"</em>{activeGenre !== 'all' ? ' in this genre' : ''}.</>
                  : 'No articles found in this category yet.'}
              </p>
              {query
                ? <button className="btn btn-ghost" onClick={() => handleQueryChange('')}>Clear search</button>
                : <Link to="/" className="btn btn-ghost">Back to Home</Link>}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="articles-page__pagination">
              <button
                className="articles-page__page-btn"
                disabled={safePage === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`articles-page__page-btn ${safePage === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="articles-page__page-btn"
                disabled={safePage === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
