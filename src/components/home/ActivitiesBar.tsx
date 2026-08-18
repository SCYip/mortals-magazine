import { Link } from 'react-router-dom'
import { Calendar, FileEdit, Users, ArrowUpRight } from 'lucide-react'
import Reveal from '../ui/Reveal'
import './ActivitiesBar.css'

const ITEMS = [
  {
    num: '01',
    icon: Calendar,
    label: 'Events & Contests',
    desc: 'Writing contests, workshops, and apprenticeships that challenge young writers at every stage.',
    href: '/events-contests',
    cta: 'Explore Events',
    external: false,
  },
  {
    num: '02',
    icon: FileEdit,
    label: 'Submit Your Work',
    desc: 'Every voice matters — fiction, nonfiction, poetry, essays. Share your writing with The Mortals.',
    href: 'https://forms.cloud.microsoft/r/82x3JkRjBR',
    cta: 'Submit Now',
    external: true,
  },
  {
    num: '03',
    icon: Users,
    label: 'Join the Team',
    desc: 'Editing, design, publicity, writing — find your place on The Mortals editorial board.',
    href: '/join',
    cta: 'See Open Roles',
    external: false,
  },
]

export default function ActivitiesBar() {
  return (
    <section className="activities section section--surface">
      <div className="container container--wide">
        <Reveal>
          <div className="activities__head">
            <span className="overline">Get Involved</span>
            <h2 className="activities__title">Three ways to engage</h2>
          </div>
        </Reveal>

        <div className="activities__grid">
          {ITEMS.map((item, i) => (
            <Reveal key={item.label} delay={120 + i * 90}>
              <article className="activities__card">
                <header className="activities__card-head">
                  <span className="activities__card-num">{item.num}</span>
                  <span className="activities__card-icon"><item.icon size={18} strokeWidth={1.4} /></span>
                </header>
                <h3 className="activities__card-label">{item.label}</h3>
                <p className="activities__card-desc">{item.desc}</p>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="activities__card-cta">
                    {item.cta} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <Link to={item.href} className="activities__card-cta">
                    {item.cta} <ArrowUpRight size={14} />
                  </Link>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
