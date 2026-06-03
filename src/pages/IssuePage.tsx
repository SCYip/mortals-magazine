import { useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import { useVolumes } from '../data/hooks'
import { volumes as staticVolumes } from '../data/articles'
import Reveal from '../components/ui/Reveal'
import './IssuePage.css'

export default function IssuePage() {
  const { volSlug, issueSlug } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { volumes, loading } = useVolumes()

  // Look up the issue in the live (Supabase-backed) volumes first,
  // then fall back to the static seed bundled in articles.ts. That
  // way the page works even if VolumesPage rendered from the seed
  // while the DB has a slightly different set.
  const found = useMemo(() => {
    const search = (list: typeof staticVolumes) => {
      const vol = list.find(v => v.slug === volSlug)
      const issue = vol?.issues.find(i => i.slug === issueSlug)
      return vol && issue ? { vol, issue } : null
    }
    return search(volumes) ?? search(staticVolumes)
  }, [volumes, volSlug, issueSlug])

  // If the URL came in with ?print, fire the browser print dialog as
  // soon as the content is on screen. "Save as PDF" in that dialog
  // is the cheapest way to give viewers a downloadable PDF without
  // having to upload a real one per issue.
  useEffect(() => {
    if (!found) return
    if (!params.has('print')) return
    // If a real magazine PDF is attached to this issue, hand the viewer
    // that file instead of print-to-PDF of this page.
    if (found.issue.pdfUrl) { window.location.href = found.issue.pdfUrl; return }
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [found, params])

  if (loading) {
    return (
      <div className="issue-page">
        <div className="container">
          <p className="issue-page__loading">Loading issue…</p>
        </div>
      </div>
    )
  }
  if (!found) {
    return (
      <div className="issue-page">
        <div className="container">
          <p className="issue-page__loading">Issue not found.</p>
          <Link to="/volumes" className="btn btn-ghost">
            <ArrowLeft size={14} /> Back to Volumes
          </Link>
        </div>
      </div>
    )
  }

  const { vol, issue } = found

  return (
    <div className="issue-page">
      <div className="container container--reading">
        <Reveal>
          <nav className="issue-page__crumbs">
            <Link to="/volumes" className="issue-page__crumb-link">
              <ArrowLeft size={14} /> Volumes
            </Link>
            <span className="issue-page__crumb-sep">·</span>
            <span className="issue-page__crumb-here">{vol.title}</span>
          </nav>
          <span className="overline">{issue.season} {issue.year}</span>
          <h1 className="issue-page__title">{issue.title}</h1>
          {issue.quote && (
            <blockquote className="issue-page__quote">
              <p>{issue.quote}</p>
              {issue.quoteAuthor && <cite>— {issue.quoteAuthor}</cite>}
            </blockquote>
          )}
        </Reveal>

        <Reveal>
          <article className="issue-page__body">
            {(issue.content ?? '').split('\n\n').map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </article>
        </Reveal>

        <Reveal>
          <div className="issue-page__actions">
            {issue.pdfUrl ? (
              <a className="btn btn-primary" href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download size={14} /> Download PDF
              </a>
            ) : (
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Download size={14} /> Download (Save as PDF)
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/volumes')}>
              <ArrowLeft size={14} /> Back to Volumes
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
