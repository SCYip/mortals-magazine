import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { useHeroSlides } from '../../data/hooks'
import './HeroSection.css'

const INTERVAL = 6000

export default function HeroSection() {
  const { slides } = useHeroSlides()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length === 0) return
    const id = setInterval(() => setActive(a => (a + 1) % slides.length), INTERVAL)
    return () => clearInterval(id)
  }, [slides.length])

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero__slide ${i === active ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          />
        ))}
        <div className="hero__veil" />
        <div className="hero__grain" />
      </div>

      <div className="hero__frame" aria-hidden="true">
        <span className="hero__corner hero__corner--tl" />
        <span className="hero__corner hero__corner--tr" />
        <span className="hero__corner hero__corner--bl" />
        <span className="hero__corner hero__corner--br" />
      </div>

      <div className="container container--wide hero__inner">
        <h1 className="hero__title">
          <span className="hero__title-word">The</span>
          <span className="hero__title-word hero__title-word--italic">Mortals</span>
        </h1>

        <p className="hero__lede">
          Fiction, essays, poetry, memoirs, reviews —<br />
          a student-led literary dispatch spanning eleven BASIS China campuses.
        </p>

        <div className="hero__quote">
          <span className="hero__quote-mark">&ldquo;</span>
          <p className="hero__quote-body">
            We do not need magic to transform our world. We carry all the power we need inside ourselves already.
          </p>
          <p className="hero__quote-author">— J.K. Rowling</p>
        </div>

        <div className="hero__actions">
          <a
            href="https://forms.office.com/pages/responsepage.aspx?id=4uHGy7umAkC73G2okqBRp6xsy5ePBBNGqQHOmRnLOqhUM1VMMjFIWDVVMU1OOUhIMFA4WUIyS05DMy4u"
            target="_blank" rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Submit Your Work <ArrowRight size={14} />
          </a>
          <a
            href="https://johnny1003.github.io/mortalssaff/departments"
            target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            Join the Team
          </a>
        </div>

        <div className="hero__meta">
          <div className="hero__stat">
            <span className="hero__stat-num">11</span>
            <span className="hero__stat-label">BASIS China Schools</span>
          </div>
          <span className="hero__stat-rule" />
          <div className="hero__stat">
            <span className="hero__stat-num">3×</span>
            <span className="hero__stat-label">Issues per year</span>
          </div>
          <span className="hero__stat-rule" />
          <div className="hero__stat">
            <span className="hero__stat-num">100+</span>
            <span className="hero__stat-label">Student contributors</span>
          </div>
        </div>
      </div>

      <div className="hero__dock">
        <div className="hero__dots" role="tablist" aria-label="Background slides">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              className={`hero__dot ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
        <div className="hero__scroll" aria-hidden="true">
          <span className="hero__scroll-label">Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </div>
    </section>
  )
}
