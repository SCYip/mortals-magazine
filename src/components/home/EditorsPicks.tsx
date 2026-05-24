import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useArticles } from '../../data/hooks'
import ArticleCard from '../articles/ArticleCard'
import Reveal from '../ui/Reveal'
import './EditorsPicks.css'

export default function EditorsPicks() {
  const { articles } = useArticles()
  const picks = articles.slice(0, 5)

  return (
    <section className="picks section">
      <div className="container container--wide">
        <Reveal>
          <div className="picks__head">
            <div className="picks__head-lead">
              <span className="overline">Curated Selection</span>
              <h2 className="picks__title">Editor's Picks</h2>
              <p className="picks__kicker">
                Five pieces our editors keep returning to — from the latest volume and the archive alike.
              </p>
            </div>
            <Link to="/all-articles" className="picks__all">
              See all articles <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="picks__rail" aria-label="Editor's picks">
        <div className="picks__track">
          {picks.map((article, i) => (
            <Reveal key={article.id} delay={i * 90}>
              <ArticleCard article={article} featured />
            </Reveal>
          ))}
          <div className="picks__rail-end" aria-hidden="true">
            <span className="picks__rail-end-mark">❖</span>
            <span className="picks__rail-end-label">End of selection</span>
          </div>
        </div>
      </div>
    </section>
  )
}
