import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '../ui/Reveal'
import './FeatureSection.css'

interface Feature {
  num: string
  eyebrow: string
  title: string
  body: string
  imageUrl: string
  ctaLabel: string
  ctaHref: string
  stats?: { num: string; label: string }[]
  list?: { label: string; detail: string }[]
  imageLabel?: string
}

const FEATURES: Feature[] = [
  {
    num: '01',
    eyebrow: 'Annual Events',
    title: 'Writing Contests',
    body: 'Each year, The Mortals coordinates with BASIS China\'s English Department to host a writing contest, its format as creative as the writing it celebrates. Past editions include a poetry slam, a creative debate, and an "Observatory" in which contestants were immersed in campus locations and asked to describe what they saw as vividly as possible.',
    imageUrl: '/images/feature_contest.jpg',
    imageLabel: 'Contests',
    ctaLabel: 'Learn about contests',
    ctaHref: '/events-contests',
    stats: [
      { num: '8+', label: 'Campuses' },
      { num: '100+', label: 'Submissions' },
      { num: '5+', label: 'Guest Judges' },
    ],
  },
  {
    num: '02',
    eyebrow: 'Academic Programs',
    title: 'Writing Courses',
    body: 'The Mortals editorial board designed two foundational English writing courses for primary school students across the eleven BASIS China schools. Extracurricular in design, the courses break from the syllabus in their emphasis on the rhetorical situation and the literary license — cornerstones of nonfiction and fiction, respectively.',
    imageUrl: '/images/feature_courses.jpg',
    imageLabel: 'Courses',
    ctaLabel: 'Explore courses',
    ctaHref: '/events-contests',
    list: [
      { label: 'Rhetoric', detail: 'Nonfiction — argument, persuasion, analytical writing' },
      { label: 'Literature', detail: 'Fiction — storytelling, narrative craft, literary license' },
    ],
  },
  {
    num: '03',
    eyebrow: 'Community Events',
    title: "Writers' Workshops",
    body: 'Each year, The Mortals hosts a workshop, inviting published authors, alumni, and Heads of Schools as guest speakers and lecturers. Each workshop weaves together a nurturing, interactive environment and a cutting-edge, experimental pedagogy — creating a space for students to refine their craft through feedback, discussion, and exploration of literary techniques.',
    imageUrl: '/images/feature_workshop.jpg',
    imageLabel: 'Workshops',
    ctaLabel: 'See past workshops',
    ctaHref: '/events-contests',
  },
]

export default function FeatureSection() {
  return (
    <section className="features section">
      <div className="container container--wide">
        <Reveal>
          <div className="features__intro">
            <span className="overline">What We Do</span>
            <h2 className="features__intro-title">
              Beyond the <em>page</em>
            </h2>
            <p className="features__intro-body">
              The magazine is one surface of a broader literary community — contests, courses, and
              workshops that give writers a place to practice, refine, and be heard.
            </p>
          </div>
        </Reveal>

        <div className="features__list">
          {FEATURES.map((f, i) => (
            <Reveal key={f.num} delay={i * 60}>
              <article className={`feature ${i % 2 === 1 ? 'feature--reverse' : ''}`}>
                <div className="feature__visual">
                  <div className="feature__visual-frame">
                    <img
                      src={f.imageUrl}
                      alt={f.title}
                      className="feature__img"
                      loading="lazy"
                    />
                    <span className="feature__visual-tag">{f.imageLabel ?? f.title}</span>
                  </div>
                  <span className="feature__visual-num">{f.num}</span>
                </div>

                <div className="feature__content">
                  <span className="overline">{f.eyebrow}</span>
                  <h3 className="feature__title">{f.title}</h3>
                  <p className="feature__body">{f.body}</p>

                  {f.stats && (
                    <div className="feature__stats">
                      {f.stats.map(s => (
                        <div key={s.label} className="feature__stat">
                          <span className="feature__stat-num">{s.num}</span>
                          <span className="feature__stat-label">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {f.list && (
                    <ul className="feature__bullets">
                      {f.list.map(item => (
                        <li key={item.label} className="feature__bullet">
                          <span className="feature__bullet-dot" aria-hidden="true" />
                          <div className="feature__bullet-text">
                            <span className="feature__bullet-label">{item.label}</span>
                            <span className="feature__bullet-detail">{item.detail}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link to={f.ctaHref} className="feature__cta">
                    {f.ctaLabel} <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
