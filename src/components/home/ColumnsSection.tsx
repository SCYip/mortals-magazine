import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { columns } from '../../data/articles'
import Reveal from '../ui/Reveal'
import './ColumnsSection.css'

export default function ColumnsSection() {
  return (
    <section className="cols section section--deep">
      <div className="container container--wide">
        <Reveal>
          <div className="cols__head">
            <span className="overline">Standing Columns</span>
            <h2 className="cols__title">
              Four rooms for <em>recurring</em> voices
            </h2>
            <p className="cols__sub">
              Dedicated spaces where student activists and organizations run columns on a shared
              subject — the cosmos, sustainability, poetry, storytelling — returning issue after issue.
            </p>
          </div>
        </Reveal>

        <div className="cols__grid">
          {columns.map((col, i) => (
            <Reveal key={col.slug} delay={i * 80}>
              <Link
                to={`/column/${col.slug}`}
                className="colcard"
                style={{ '--col-tone': col.color } as React.CSSProperties}
              >
                <div className="colcard__image">
                  {col.imageUrl ? (
                    <img src={col.imageUrl} alt={col.name} loading="lazy" />
                  ) : (
                    <div className="colcard__image-bg" />
                  )}
                  <div className="colcard__image-veil" aria-hidden="true" />
                  <span className="colcard__index">0{i + 1}</span>
                </div>

                <div className="colcard__body">
                  <span className="colcard__tagline">{col.tagline}</span>
                  <h3 className="colcard__name">{col.name}</h3>
                  <p className="colcard__desc">{col.description}</p>
                  <span className="colcard__cta">
                    Enter column <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
