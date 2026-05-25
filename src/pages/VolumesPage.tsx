import { Link } from 'react-router-dom'
import { Eye, Download } from 'lucide-react'
import { volumes } from '../data/articles'
import Reveal from '../components/ui/Reveal'
import './VolumesPage.css'

export default function VolumesPage() {
  return (
    <div className="volumes-page">
      {/* Hero */}
      <div className="volumes-page__hero">
        <div className="volumes-page__hero-bg" />
        <div className="container">
          <Reveal>
            <span className="overline">The Archive</span>
            <h1>Our Volumes</h1>
            <p className="volumes-page__intro">
              The Mortals runs a quarterly magazine that is funded by, printed by, and distributed across eleven BASIS China schools.
              Each school year, the magazine's editorial board decides on a unifying theme for the volume — often an abstract concept
              that propels reasoning and imagination.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Volume Cards */}
      <section className="section">
        <div className="container">
          <div className="volumes-page__grid">
            {volumes.map((vol, i) => (
              <Reveal key={vol.slug} delay={i * 100}>
                <div className="volume-card">
                  <div className="volume-card__image">
                    {vol.imageUrl ? (
                      <img src={vol.imageUrl} alt={vol.title} loading="lazy" />
                    ) : (
                      <div className="volume-card__placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      </div>
                    )}
                    <div className="volume-card__overlay" />
                  </div>
                  <div className="volume-card__body">
                    <div className="volume-card__meta">
                      <span className="tag">{vol.season}</span>
                      <span className="volume-card__year">{vol.year}</span>
                    </div>
                    <h3 className="volume-card__title">{vol.title}</h3>
                    <p className="volume-card__theme">
                      <span className="volume-card__theme-label">Theme:</span> {vol.theme}
                    </p>
                    <p className="volume-card__issues">
                      {vol.issues.length > 0
                        ? `${vol.issues.length} issue${vol.issues.length > 1 ? 's' : ''} published`
                        : 'Issues coming soon'}
                    </p>
                    {vol.issues.map(issue => (
                      <div key={issue.slug} className="volume-card__issue">
                        <h4>{issue.title}</h4>
                        <blockquote className="volume-card__issue-quote">
                          {issue.quote}
                        </blockquote>
                        <div className="volume-card__issue-actions">
                          <Link
                            to={`/volumes/${vol.slug}/issue/${issue.slug}`}
                            className="btn btn-primary btn-sm"
                          >
                            <Eye size={12} /> View Issue
                          </Link>
                          <a
                            href={`/volumes/${vol.slug}/issue/${issue.slug}?print=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="volumes-page__cta section">
        <div className="container">
          <Reveal>
            <div className="volumes-page__cta-inner">
              <h2>Read Our Latest Issue</h2>
              <p>The digital version of selected issues are emailed to all BASIS China students, parents, faculty, and staff; and are available online through this website.</p>
              <div className="volumes-page__cta-actions">
                <Link to="/all-articles" className="btn btn-primary">
                  Browse All Articles
                </Link>
                <a
                  href="https://forms.office.com/pages/responsepage.aspx?id=4uHGy7umAkC73G2okqBRp6xsy5ePBBNGqQHOmRnLOqhUM1VMMjFIWDVVMU1OOUhIMFA4WUIyS05DMy4u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  Submit Your Work
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
