import { useParams, Navigate, Link } from 'react-router-dom'
import { useArticles } from '../data/hooks'
import ArticleCard from '../components/articles/ArticleCard'
import Reveal from '../components/ui/Reveal'
import './GenrePage.css'

const GENRE_META: Record<string, { label: string; description: string }> = {
  nonfiction: {
    label: 'Nonfiction',
    description: 'Essays, speeches, argumentative writing, memoirs, and critical analysis. Nonfiction in The Mortals explores real ideas, real voices, and real arguments.',
  },
  'fiction-poetry': {
    label: 'Fiction (Poetry)',
    description: 'Poems in every form — from structured sonnets and villanelles to experimental free verse. Every line carries weight.',
  },
  'fiction-prose': {
    label: 'Fiction (Prose)',
    description: 'Short fiction, flash fiction, micro-stories, and narrative experiments. The art of making things up and making them matter.',
  },
  review: {
    label: 'Reviews',
    description: 'Critical reviews of books, films, and games — analytical writing that engages with culture and craft.',
  },
  other: {
    label: 'Other',
    description: 'Writing that defies easy categorization. Speeches, hybrid forms, and everything in between.',
  },
}

export default function GenrePage() {
  const { genre } = useParams<{ genre: string }>()
  const { articles, loading } = useArticles()

  if (!genre || !GENRE_META[genre]) return <Navigate to="/all-articles" replace />

  const meta = GENRE_META[genre]
  const filtered = articles.filter(a => a.genre === genre)

  if (loading) {
    return (
      <div className="genre-page">
        <div className="container">
          <p className="genre-page__loading">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="genre-page">
      <div className="genre-page__hero">
        <div className="genre-page__hero-bg" />
        <div className="container">
          <Reveal>
            <div className="genre-page__breadcrumb">
              <Link to="/all-articles">All Articles</Link>
              <span>/</span>
              <span>{meta.label}</span>
            </div>
            <span className="overline">{meta.label}</span>
            <h1>{meta.label}</h1>
            <p className="genre-page__desc">{meta.description}</p>
            <span className="genre-page__count">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
          </Reveal>
        </div>
      </div>

      <div className="container">
        <div className="genre-page__body">
          {filtered.length > 0 ? (
            <div className="genre-page__grid">
              {filtered.map((article, i) => (
                <Reveal key={article.id} delay={i * 60}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="genre-page__empty">
              <p>No articles in this category yet.</p>
              <Link to="/all-articles" className="btn btn-ghost">Browse All Articles</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
