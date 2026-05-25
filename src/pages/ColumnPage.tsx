import { useParams, Navigate } from 'react-router-dom'
import { useArticles, useColumns } from '../data/hooks'
import ArticleCard from '../components/articles/ArticleCard'
import Reveal from '../components/ui/Reveal'
import './ColumnPage.css'

export default function ColumnPage() {
  const { slug } = useParams<{ slug: string }>()
  const { columns, loading: columnsLoading } = useColumns()
  const { articles, loading: articlesLoading } = useArticles()
  const loading = columnsLoading || articlesLoading

  if (loading) {
    return (
      <div className="column-page">
        <div className="container">
          <p className="column-page__loading">Loading column…</p>
        </div>
      </div>
    )
  }

  const column = columns.find(c => c.slug === slug)
  if (!column) return <Navigate to="/" replace />

  // Match by the multi-column junction first, falling back to the
  // legacy single-column field so unmigrated rows still appear.
  const columnArticles = articles.filter((a) => {
    if (a.columnSlugs && a.columnSlugs.length > 0) return a.columnSlugs.includes(slug!)
    return a.columnSlug === slug
  })

  return (
    <div className="column-page">
      {/* Column Header */}
      <div className="column-page__header">
        <div
          className="column-page__header-bg"
          style={{
            '--col-color': column.color,
            '--col-image': column.imageUrl ? `url(${column.imageUrl})` : 'none',
          } as React.CSSProperties}
        />
        <div className="container">
          <Reveal>
            <span
              className="column-page__tag"
              style={{ color: column.color, borderColor: `${column.color}44`, background: `${column.color}11` }}
            >
              {column.tagline}
            </span>
            <h1 className="column-page__name">{column.name}</h1>
            <p className="column-page__desc">{column.description}</p>
            <span className="column-page__count">
              {columnArticles.length} article{columnArticles.length !== 1 ? 's' : ''}
            </span>
          </Reveal>
        </div>
      </div>

      {/* Articles */}
      <div className="container">
        <div className="column-page__body">
          {columnArticles.length > 0 ? (
            <div className="column-page__grid">
              {columnArticles.map((article, i) => (
                <Reveal key={article.id} delay={i * 60}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="column-page__empty">
              <p>No articles published in this column yet. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
