import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '../ui/Reveal'
import { editorsNote } from '../../data/articles'
import './EditorsNote.css'

export default function EditorsNote() {
  const paragraphs = editorsNote.content.split('\n\n').filter(p => p.trim())
  const first = paragraphs[0] ?? ''
  const body = paragraphs.slice(1, 3)

  return (
    <section className="note section">
      <div className="note__atmos" aria-hidden="true">
        <div className="note__mesh" />
        <div className="note__grain" />
      </div>

      <div className="container">
        <Reveal>
          <div className="note__inner">
            <aside className="note__aside">
              <span className="note__label">Prologue · Vol. I</span>
              <div className="note__corner" aria-hidden="true">
                <span className="note__corner-v" />
                <span className="note__corner-h" />
              </div>
            </aside>

            <div className="note__main">
              <div className="note__eyebrow">
                <span className="note__eyebrow-line" />
                <span className="overline">Editor's Note</span>
                <span className="note__eyebrow-line" />
              </div>

              <h2 className="note__title">
                On the shelf life of <em>mortal</em> souls
              </h2>

              <div className="note__drop">
                <span className="note__drop-cap">{first.charAt(0)}</span>
                <p className="note__drop-body">{first.slice(1)}</p>
              </div>

              {body.map((para, i) => (
                <p key={i} className="note__para">{para}</p>
              ))}

              <div className="note__sign">
                <div className="note__sign-authors">
                  {editorsNote.authors.map(author => (
                    <span key={author} className="note__author">{author}</span>
                  ))}
                </div>
                <span className="note__sign-role">Editors-in-Chief</span>
              </div>

              <Link to="/all-articles" className="note__cta">
                Read the issue <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
