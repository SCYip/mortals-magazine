import { Link } from 'react-router-dom'
import { PenTool, MessageSquare, Users } from 'lucide-react'
import Reveal from '../ui/Reveal'
import './AboutStrip.css'

const PILLARS = [
  { icon: PenTool, label: 'Writing', desc: 'Fiction, essays, poetry, memoirs, speeches, and reviews from student authors.' },
  { icon: MessageSquare, label: 'Rhetoric', desc: 'Critical thinking and persuasive communication — courses and contests.' },
  { icon: Users, label: 'Community', desc: 'A shared literary culture spanning eleven BASIS China campuses.' },
]

export default function AboutStrip() {
  return (
    <section className="about section">
      <div className="container container--wide">
        <div className="about__grid">
          <Reveal className="about__text-wrap">
            <span className="overline">About The Mortals</span>
            <h2 className="about__heading">
              A student-led literary magazine for the <em>eleven</em> BASIS China schools.
            </h2>
            <p className="about__body">
              We are a platform for burgeoning writers, critical readers, and creative thinkers
              within the BASIS China network and beyond — sharing meaningful voices, thought-provoking
              ideas, and bold imagination that transcend the page.
            </p>
            <Link to="/about" className="btn-text">Learn more about us →</Link>
          </Reveal>

          <div className="about__pillars">
            {PILLARS.map((p, i) => (
              <Reveal key={p.label} delay={120 + i * 100}>
                <article className="about__pillar">
                  <span className="about__pillar-index">0{i + 1}</span>
                  <div className="about__pillar-icon"><p.icon size={22} strokeWidth={1.2} /></div>
                  <h3 className="about__pillar-label">{p.label}</h3>
                  <p className="about__pillar-desc">{p.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
