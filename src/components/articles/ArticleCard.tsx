import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Article } from '../../data/articles'
import './ArticleCard.css'

interface ArticleCardProps {
  article: Article
  featured?: boolean
}

const GENRE_LABEL: Record<string, string> = {
  nonfiction: 'Nonfiction',
  'fiction-poetry': 'Fiction · Poetry',
  'fiction-prose': 'Fiction · Prose',
  review: 'Review',
  other: 'Dispatch',
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <Link
      to={`/all-articles/${article.slug}`}
      className={`acard ${featured ? 'acard--featured' : ''}`}
    >
      <div className="acard__image">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} loading="lazy" />
        ) : (
          <div className="acard__placeholder" aria-hidden="true">
            <span className="acard__placeholder-mark">❖</span>
          </div>
        )}
        <span className="acard__image-grain" aria-hidden="true" />
      </div>

      <div className="acard__body">
        <div className="acard__meta">
          <span className="acard__genre">{GENRE_LABEL[article.genre] || article.genre}</span>
          <span className="acard__meta-sep">·</span>
          <span className="acard__date">{article.date}</span>
        </div>

        <h3 className="acard__title">{article.title}</h3>
        <p className="acard__excerpt">{article.excerpt}</p>

        <div className="acard__foot">
          <div className="acard__author">
            <span className="acard__author-name">{article.author}</span>
            {article.authorAffiliation && (
              <span className="acard__author-affil">{article.authorAffiliation}</span>
            )}
          </div>
          <span className="acard__read"><ArrowUpRight size={14} /></span>
        </div>
      </div>
    </Link>
  )
}
