import { ArrowUpRight, Mail, MessageCircle, Users, Edit3, Palette, Megaphone, Feather, Handshake } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Reveal from '../components/ui/Reveal'
import './JoinPage.css'

// Application form (Microsoft Forms) — the single entry point for
// joining ANY department. Applicants pick their department in the form.
export const JOIN_FORM_URL =
  'https://forms.cloud.microsoft/pages/responsepage.aspx?id=4uHGy7umAkC73G2okqBRp51qqtBFJf1KraiwmuB_4-FUMFpKQjdOU1ZXSTA3RzlTVlhHT0ZMQUNWMy4u&route=shorturl'

// The four departments from the original staff site. You apply to a
// DEPARTMENT; the specific roles nested inside are what you'd actually do.
interface Role { title: string; desc: string }
interface Department { name: string; icon: LucideIcon; tagline: string; blurb: string; roles: Role[] }

const DEPARTMENTS: Department[] = [
  {
    name: 'Editing',
    icon: Edit3,
    tagline: 'Words, made right',
    blurb: 'Review every submission, make the grammatical edits, and set the theme for each section of the magazine.',
    roles: [
      { title: 'Editor Manager', desc: "Steer the editing board and make the magazine's major editorial decisions." },
      { title: 'Column / Section Editor', desc: "Review submissions, edit for grammar and clarity, and shape your section's theme." },
    ],
  },
  {
    name: 'Designing',
    icon: Palette,
    tagline: 'How the issue looks',
    blurb: 'Make the stylistic decisions and build every issue, page by page, in Canva.',
    roles: [
      { title: 'Design Manager', desc: "Steer the design board and make the magazine's major visual decisions." },
      { title: 'Column / Section Designer', desc: 'Make the stylistic calls and lay out your section in Canva.' },
    ],
  },
  {
    name: 'Publicity',
    icon: Megaphone,
    tagline: 'Where readers find us',
    blurb: 'Carry the magazine beyond the page — run this website and design the WeChat 公众号.',
    roles: [
      { title: 'Website Manager', desc: "Run and refine this website, the magazine's digital home." },
      { title: '公众号 Editor & Designer', desc: 'Design and refurbish our WeChat Official Account (公众号).' },
    ],
  },
  {
    name: 'Columns',
    icon: Feather,
    tagline: 'Your own byline',
    blurb: 'Commit to a recurring column and publish it on its own page in every issue.',
    roles: [
      { title: 'Columnist', desc: 'Commit to writing one newsletter article a week for your column.' },
    ],
  },
]

const PARTNERSHIP = {
  title: 'Club Leader Patron',
  icon: Handshake,
  desc: "Lead a club instead of joining a department? Partner with us to advocate your club's projects and products in the magazine. Same form — just tell us you're applying as a Club Leader Patron.",
}

const STEPS = [
  { num: '01', title: 'Apply', desc: 'Fill in the one shared form and name the department you want to join. It takes a few minutes.' },
  { num: '02', title: 'Hear back', desc: 'We read every application — no experience needed to hear yes. We reply by school email or Microsoft Teams.' },
  { num: '03', title: 'Onboard', desc: 'Meet your department, take up your first assignment, and start shaping the next issue.' },
]

export default function JoinPage() {
  return (
    <div className="join-page">
      {/* Hero */}
      <div className="join-page__hero">
        <div className="join-page__hero-bg" />
        <div className="container">
          <Reveal>
            <span className="overline">Join the Masthead</span>
            <h1>Find Your Department</h1>
            <p className="join-page__intro">
              Writers, editors, designers, and organizers from all eleven BASIS China campuses make
              this magazine happen. Choose the department whose craft is yours — every one has a place
              for a first-timer, and no prior experience is required, only commitment and curiosity.
              One form covers every department.
            </p>
            <div className="join-page__hero-actions">
              <a href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Apply to Join <ArrowUpRight size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Departments — apply to a department; roles nested as its staff */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="folio">
              <span className="folio__rule" />
              <span className="folio__numeral">The Editorial Board</span>
              <span className="folio__rule" />
            </div>
            <div className="join-page__section-header">
              <span className="overline">Four Departments</span>
              <h2>Where you fit in</h2>
              <p className="join-page__section-sub">
                Four crafts keep every issue moving. Pick the one that's yours — the roles inside it
                are what you'd actually do.
              </p>
            </div>
          </Reveal>

          <div className="join-page__depts">
            {DEPARTMENTS.map((dept, i) => (
              <div key={dept.name}>
                {i > 0 && <div className="fine-rule" />}
                <Reveal delay={i * 80}>
                  <article className="join-dept">
                    <div className="join-dept__rail">
                      <span className="join-dept__icon">
                        <dept.icon size={20} strokeWidth={1.6} />
                      </span>
                      <h3 className="join-dept__name">{dept.name}</h3>
                      <p className="kicker">{dept.tagline}</p>
                      <p className="join-dept__blurb">{dept.blurb}</p>
                      <a href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        Apply to this department <ArrowUpRight size={12} />
                      </a>
                    </div>
                    <div className="join-dept__roles">
                      <div className="colophon">
                        {dept.roles.map(role => (
                          <div key={role.title} className="colophon__row">
                            <span className="colophon__key join-dept__role-name">{role.title}</span>
                            <span className="colophon__leader" />
                            <span className="colophon__val">{role.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership — set apart from the four core departments */}
      <section className="section section--deep">
        <div className="container">
          <Reveal>
            <div className="join-page__partner">
              <span className="overline">Another way in</span>
              <span className="join-dept__icon join-page__partner-icon">
                <PARTNERSHIP.icon size={20} strokeWidth={1.6} />
              </span>
              <h3 className="join-page__partner-title">{PARTNERSHIP.title}</h3>
              <p className="join-page__partner-desc">{PARTNERSHIP.desc}</p>
              <a href={JOIN_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Apply as a Club Leader Patron <ArrowUpRight size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="folio">
              <span className="folio__rule" />
              <span className="folio__numeral">How It Works</span>
              <span className="folio__rule" />
            </div>
            <div className="join-page__section-header">
              <span className="overline">Three Steps In</span>
              <h2>From form to first issue</h2>
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

      {/* Closing CTA */}
      <section className="join-page__cta section">
        <div className="container">
          <Reveal>
            <div className="join-page__cta-inner">
              <Users size={28} strokeWidth={1.4} className="join-page__cta-icon" />
              <h2>Ready to make something that outlasts us?</h2>
              <p>
                Applications are open year-round, and one form covers every department. Tell us where
                your craft belongs — we'll be in touch by school email or Microsoft Teams.
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
