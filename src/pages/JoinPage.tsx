import { ArrowUpRight, Mail, MessageCircle, Users } from 'lucide-react'
import Reveal from '../components/ui/Reveal'
import './JoinPage.css'

// Application form (Microsoft Forms) — the single entry point for
// joining the editorial board.
export const JOIN_FORM_URL =
  'https://forms.cloud.microsoft/pages/responsepage.aspx?id=4uHGy7umAkC73G2okqBRp51qqtBFJf1KraiwmuB_4-FUMFpKQjdOU1ZXSTA3RzlTVlhHT0ZMQUNWMy4u&route=shorturl'

// Roles mirror the original staff site's Join page, lightly edited.
const ROLES = [
  { title: 'Editor Manager', dept: 'Editing', desc: 'Administer and make the major editing decisions for the magazine.' },
  { title: 'Design Manager', dept: 'Design', desc: 'Administer and make the major design decisions for the magazine.' },
  { title: 'Website Manager', dept: 'Publicity', desc: "Run and refine this website — the magazine's digital home." },
  { title: 'Column / Section Editor', dept: 'Editing', desc: 'Review submissions, make grammatical edits, and create themes for each magazine section.' },
  { title: 'Column / Section Designer', dept: 'Design', desc: 'Make stylistic decisions and design the magazine in Canva.' },
  { title: '公众号 Editor & Designer', dept: 'Publicity', desc: 'Design and refurbish our WeChat Official Account (公众号).' },
  { title: 'Columnist', dept: 'Columns', desc: 'Commit to writing one newsletter article per week for your column.' },
  { title: 'Club Leader Patron', dept: 'Partnerships', desc: "Advocate your club's projects and products in the magazine." },
]

const STEPS = [
  { num: '01', title: 'Apply', desc: 'Fill in the application form — it takes a few minutes. Tell us who you are and where you want to contribute.' },
  { num: '02', title: 'Hear back', desc: 'We review every application. Notifications are sent via school email and Teams.' },
  { num: '03', title: 'Onboard', desc: 'Meet your department, pick up your first tasks, and start shaping the next issue.' },
]

export default function JoinPage() {
  return (
    <div className="join-page">
      {/* Hero */}
      <div className="join-page__hero">
        <div className="join-page__hero-bg" />
        <div className="container">
          <Reveal>
            <span className="overline">Join Us</span>
            <h1>Join The Mortals</h1>
            <p className="join-page__intro">
              Writers, editors, designers, and organizers from all eleven BASIS China campuses make
              this magazine happen. Find your place on the editorial board — no prior experience
              required, only commitment and curiosity.
            </p>
            <div className="join-page__hero-actions">
              <a href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Apply to Join <ArrowUpRight size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Roles */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="join-page__section-header">
              <span className="overline">Open Roles</span>
              <h2>Become a…</h2>
            </div>
          </Reveal>
          <div className="join-page__roles">
            {ROLES.map((role, i) => (
              <Reveal key={role.title} delay={i * 60}>
                <article className="join-role">
                  <span className="join-role__dept">{role.dept}</span>
                  <h3 className="join-role__title">{role.title}</h3>
                  <p className="join-role__desc">{role.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="join-page__process section section--deep">
        <div className="container">
          <Reveal>
            <div className="join-page__section-header">
              <span className="overline">How It Works</span>
              <h2>Three steps in</h2>
            </div>
          </Reveal>
          <div className="join-page__steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 90}>
                <div className="join-step">
                  <span className="join-step__num">{s.num}</span>
                  <h3 className="join-step__title">{s.title}</h3>
                  <p className="join-step__desc">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="join-page__cta section">
        <div className="container">
          <Reveal>
            <div className="join-page__cta-inner">
              <Users size={28} strokeWidth={1.4} className="join-page__cta-icon" />
              <h2>Ready to make something that outlasts us?</h2>
              <p>
                Applications are open year-round. Fill in the form and we'll be in touch via
                email or Teams.
              </p>
              <a href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Apply to Join <ArrowUpRight size={14} />
              </a>
              <div className="join-page__contact">
                <a href="mailto:themortals@basischina.com" className="join-page__contact-item">
                  <Mail size={14} /> themortals@basischina.com
                </a>
                <span className="join-page__contact-item">
                  <MessageCircle size={14} /> WeChat: The Mortals Magazine-人间志
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
