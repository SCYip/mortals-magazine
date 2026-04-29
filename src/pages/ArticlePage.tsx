import { useParams, Link, Navigate } from 'react-router-dom'
import { articles } from '../data/articles'
import ArticleCard from '../components/articles/ArticleCard'
import Reveal from '../components/ui/Reveal'
import './ArticlePage.css'

const genreLabels: Record<string, string> = {
  nonfiction: 'Nonfiction',
  'fiction-poetry': 'Fiction (Poetry)',
  'fiction-prose': 'Fiction (Prose)',
  review: 'Review',
  other: 'Other',
}

export default function ArticlePage() {
  const { slug } = useParams()
  const article = articles.find(a => a.slug === slug)

  if (!article) return <Navigate to="/all-articles" replace />

  const related = articles
    .filter(a => a.id !== article.id && (a.genre === article.genre || a.columnSlug === article.columnSlug))
    .slice(0, 3)

  return (
    <div className="article-page">
      {/* Header */}
      <div className="article-page__header">
        <div className="article-page__header-bg" />
        <div className="container">
          <Reveal>
            <div className="article-page__breadcrumb">
              <Link to="/all-articles">All Articles</Link>
              <span>/</span>
              <Link to={`/all-articles/categories/${article.genre}`}>{genreLabels[article.genre] || article.genre}</Link>
            </div>
            <div className="article-page__meta-top">
              <span className="tag">{genreLabels[article.genre] || article.genre}</span>
              <span className="article-page__date">{article.date}</span>
            </div>
            <h1 className="article-page__title">{article.title}</h1>
            <div className="article-page__author">
              <span className="article-page__author-name">{article.author}</span>
              {article.authorAffiliation && (
                <span className="article-page__author-affil"> · {article.authorAffiliation}</span>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Body */}
      <div className="container">
        <div className="article-page__body">
          <Reveal>
            <div className="article-page__prose">
              {article.content.split('\n\n').map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return <h2 key={i}>{para.replace(/\*\*/g, '')}</h2>
                }
                if (para.startsWith('*') && para.endsWith('*')) {
                  return <em key={i}>{para.replace(/\*/g, '')}</em>
                }
                if (para.startsWith('"') || para.startsWith('"')) {
                  return <blockquote key={i}>{para}</blockquote>
                }
                // Handle line breaks within paragraphs
                return (
                  <p key={i}>
                    {para.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < para.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                )
              })}
            </div>
          </Reveal>

          {/* Author Card */}
          <Reveal delay={100}>
            <div className="article-page__author-card">
              <div className="article-page__author-card-avatar">
                {article.author.charAt(0).toUpperCase()}
              </div>
              <div className="article-page__author-card-info">
                <span className="article-page__author-card-name">{article.author}</span>
                {article.authorAffiliation && (
                  <span className="article-page__author-card-affil">{article.authorAffiliation}</span>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Related Articles */}
      {related.length > 0 && (
        <div className="article-page__related">
          <div className="container">
            <Reveal>
              <div className="article-page__related-header">
                <span className="overline">Continue Reading</span>
                <h2>Related Articles</h2>
              </div>
            </Reveal>
            <div className="article-page__related-grid">
              {related.map((a, i) => (
                <Reveal key={a.id} delay={i * 80}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
