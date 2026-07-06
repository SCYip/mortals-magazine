import Reveal from '../components/ui/Reveal'
import { editorsNote } from '../data/editorsNote'
import { useTeam, useAlumni, useAcknowledgements } from '../data/hooks'
import './AboutPage.css'

export default function AboutPage() {
  const { team } = useTeam()
  const { alumni } = useAlumni()
  const { acknowledgements } = useAcknowledgements()

  return (
    <div className="about-page">
      {/* Hero */}
      <div className="about-page__hero">
        <div className="about-page__hero-bg" />
        <div className="container">
          <Reveal>
            <span className="overline">Our Story</span>
            <h1>About The Mortals</h1>
            <p className="about-page__intro">
              The Mortals is more than a publication — it is a literary project dedicated to the art of expressive
              communication in all its forms. We are the first and only student-led magazine covering the eleven BASIS China schools.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Mission */}
      <section className="about-page__mission section">
        <div className="container">
          <Reveal>
            <div className="about-page__mission-inner">
              <div>
                <span className="overline">Our Mission</span>
                <h2>Broadening Perspectives, Celebrating Voices</h2>
                <p>
                  The Mortals serves as a platform for burgeoning writers, critical readers, and creative thinkers
                  both within the Basis China Network and beyond to share meaningful voices, thought-provoking ideas,
                  and bold imagination that transcends the page.
                </p>
                <p>
                  Human life rarely lasts beyond a century — we appear and vanish like flickers of light, a mere blink
                  in the vast expanse of the cosmos. As mortals, our flesh may not endure through time's inevitability.
                  Still, our arts, our cultures, and our thoughts may cross generations.
                </p>
              </div>
              <div className="about-page__mission-stats">
                {[
                  { num: '11', label: 'BASIS China Schools' },
                  { num: '100+', label: 'Contributors' },
                  { num: '2', label: 'Issues Per Year' },
                  { num: '4', label: 'Standing Columns' },
                ].map(s => (
                  <div key={s.label} className="about-page__stat">
                    <span className="about-page__stat-num">{s.num}</span>
                    <span className="about-page__stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Team */}
      <section className="about-page__team section">
        <div className="container">
          <Reveal>
            <div className="about-page__section-header">
              <span className="overline">The People</span>
              <h2>Our Editorial Board</h2>
            </div>
          </Reveal>
          <div className="about-page__team-grid">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={i * 50}>
                <div className="about-page__member">
                  <div className="about-page__member-avatar">
                    {member.name.charAt(0)}
                  </div>
                  <div className="about-page__member-info">
                    <h3 className="about-page__member-name">{member.name}</h3>
                    <span className="about-page__member-role">{member.role}</span>
                    <span className="about-page__member-class">{member.school} {member.classYear}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Alumni */}
      <section className="about-page__alumni section">
        <div className="container">
          <Reveal>
            <div className="about-page__section-header">
              <span className="overline">Past Voices</span>
              <h2>Alumni</h2>
              <p className="about-page__alumni-lede">
                Editors and contributors who shaped the magazine in its earliest years and have since carried it
                with them into universities, careers, and the wider world.
              </p>
            </div>
          </Reveal>
          <div className="about-page__alumni-grid">
            {alumni.map((person, i) => (
              <Reveal key={person.name} delay={i * 90}>
                <article className="about-page__alum">
                  <div className="about-page__alum-portrait">
                    <img src={person.portraitUrl ?? ''} alt={person.name} loading="lazy" />
                  </div>
                  <div className="about-page__alum-info">
                    <h3 className="about-page__alum-name">{person.name}</h3>
                    <span className="about-page__alum-role">{person.role}</span>
                    <span className="about-page__alum-class">{person.school} &middot; {person.classYear}</span>
                    <p className="about-page__alum-note">{person.note}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="about-page__depts section">
        <div className="container">
          <Reveal>
            <div className="about-page__section-header">
              <span className="overline">Structure</span>
              <h2>Our Departments</h2>
            </div>
          </Reveal>
          <div className="about-page__depts-grid">
            {[
              {
                name: 'Editing Department',
                desc: 'Review submissions, make grammatical edits, create themes for each magazine section.',
                icon: '✎',
              },
              {
                name: 'Designing Department',
                desc: 'Make stylistic decisions. Use Canva to design our magazine and maintain visual cohesion.',
                icon: '◈',
              },
              {
                name: 'Publicity Department',
                desc: 'Refurbish our website on Wix and design article layouts on WeChat.',
                icon: '◎',
              },
              {
                name: 'Columns',
                desc: 'Commit to writing newsletter articles and publish them on a distinct page for each issue.',
                icon: '◫',
              },
            ].map((dept, i) => (
              <Reveal key={dept.name} delay={i * 80}>
                <div className="about-page__dept">
                  <span className="about-page__dept-icon">{dept.icon}</span>
                  <h3 className="about-page__dept-name">{dept.name}</h3>
                  <p className="about-page__dept-desc">{dept.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section className="about-page__thanks section">
        <div className="container">
          <Reveal>
            <div className="about-page__section-header">
              <span className="overline">Gratitude</span>
              <h2>Our Acknowledgements</h2>
            </div>
          </Reveal>
          <div className="about-page__thanks-grid">
            {acknowledgements.map((person, i) => (
              <Reveal key={person.name} delay={i * 80}>
                <div className="about-page__thanks-card">
                  <div className="about-page__thanks-avatar">
                    {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="about-page__thanks-name">{person.name}</h3>
                    <span className="about-page__thanks-role">{person.role}</span>
                    <p className="about-page__thanks-note">{person.note}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Editor's Note */}
      <section className="about-page__note section">
        <div className="container">
          <Reveal>
            <div className="about-page__note-inner">
              <span className="overline">Editor's Note</span>
              <div className="about-page__note-rule" />
              <blockquote className="about-page__note-quote">
                "Human life rarely lasts beyond a century — we appear and vanish like flickers of light, a mere blink
                in the vast expanse of the cosmos. As mortals, our flesh may not endure through time's inevitability.
                Still, our arts, our cultures, and our thoughts may cross generations."
              </blockquote>
              <p className="about-page__note-authors">
                — {editorsNote.authors.join(' & ')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
