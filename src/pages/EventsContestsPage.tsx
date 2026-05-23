import './EventsContestsPage.css'
import Reveal from '../components/ui/Reveal'

export default function EventsContestsPage() {
  return (
    <div className="events-page">
      {/* Page Hero */}
      <div className="events-page__hero">
        <div className="events-page__hero-bg" />
        <div className="container">
          <Reveal>
            <span className="overline">Programs & Events</span>
            <h1>Events &amp; Contests</h1>
            <p className="events-page__hero-desc">
              The Mortals is more than a publication — it is a literary project. We host three main events/programs:
              annual Writing Contests for high school, annual Writing Contests for middle school, and two elective
              writing courses for primary school. Our events at the eleven BASIS China schools are designed to inspire,
              challenge, and support young writers at every stage of their journey.
            </p>
            <p className="events-page__hero-quote">
              "At The Mortals, we believe that great writing starts with bold writing, which thrives in vibrant,
              collaborative, community-based spaces that nurture mortal souls."
            </p>
          </Reveal>
        </div>
      </div>

      <div className="container">

        {/* BIPH Writers' Workshop */}
        <section className="event-section section">
          <Reveal>
            <div className="event-section__header">
              <span className="overline">Featured Event</span>
              <h2>BIPH Writers' Workshop</h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="event-section__card">
              <div className="event-section__card-left">
                <figure className="event-section__photo">
                  <img src="/images/event_workshop.jpg" alt="BIPH Writers' Workshop" loading="lazy" />
                  <figcaption className="event-section__photo-caption">BIPH · Writers' Workshop</figcaption>
                </figure>
              </div>
              <div className="event-section__card-right">
                <h3 className="event-section__card-title">A Celebration of Literary Creativity</h3>
                <p className="event-section__card-body">
                  The Mortals Writers' Workshop is a celebration of literary creativity, collaborative learning,
                  and the transformative power of storytelling. Taking place in BIPH, this event brings together
                  sophisticated and experienced writers with emerging and curious participants in a dynamic,
                  immersive evening of writing, discussion, and discovery.
                </p>

                <div className="event-section__events">
                  <h4>Events Included</h4>
                  <ul>
                    {[
                      'Keynote Speech by Mr. Quirk, Head of BIPH & AP Literature Teacher',
                      'Gimkit & Kahoot sessions for fundamental understanding and relaxation',
                      'Timed writing competition to foster competitiveness and expression',
                      'Poetry Analysis workshop',
                      'Talks & Observatories — student-led sessions',
                    ].map(e => (
                      <li key={e}>
                        <span className="event-section__bullet">✦</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="event-section__objectives">
                  <h4>Objectives</h4>
                  <p>
                    With the aim of building a flourishing literary community across the BASIS China network,
                    The Mortals magazine and the Creative Writing Club jointly propose the Writers' Workshop,
                    designed to elevate students' writing skills, deepen their appreciation for literature,
                    and foster community-based collaborative learning.
                  </p>
                </div>

                <blockquote className="event-section__blockquote">
                  "What is in me is stronger than I am" — Albert Camus
                </blockquote>
              </div>
            </div>
          </Reveal>
        </section>

        <div className="page-divider" />

        {/* Writing Courses / Apprenticeship */}
        <section className="event-section section">
          <Reveal>
            <div className="event-section__header">
              <span className="overline">Academic Programs</span>
              <h2>Writing Course / Apprenticeship</h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="event-section__card event-section__card--reverse">
              <div className="event-section__card-left">
                <div className="event-section__photo-pair">
                  <figure className="event-section__photo event-section__photo--small">
                    <img src="/images/event_writing_course.jpg" alt="Writing Course in session" loading="lazy" />
                    <figcaption className="event-section__photo-caption">Writing Course</figcaption>
                  </figure>
                  <figure className="event-section__photo event-section__photo--small">
                    <img src="/images/event_apprenticeship.jpg" alt="Apprenticeship mentorship session" loading="lazy" />
                    <figcaption className="event-section__photo-caption">Apprenticeship</figcaption>
                  </figure>
                </div>
                <div className="event-section__stats-grid">
                  {[
                    { num: '6', label: 'Module Courses' },
                    { num: '10+', label: 'Lectures' },
                    { num: '1:1', label: 'Tutor Feedback' },
                    { num: '∞', label: 'Editorial Training' },
                  ].map(s => (
                    <div key={s.label} className="event-section__stat-box">
                      <span className="event-section__stat-num">{s.num}</span>
                      <span className="event-section__stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="event-section__card-right">
                <p className="event-section__card-body">
                  The Mortals' Apprenticeship Programme is a unique opportunity for students ready to elevate
                  their creative and editorial skills to a professional level. Tailored for aspiring editors,
                  writers, and designers, this programme offers hands-on experience and direct mentorship,
                  guiding participants through the intricate and rewarding process of publishing a literary magazine.
                </p>
                <p className="event-section__card-body">
                  Over several weeks, apprentices are matched with seasoned mentors — from editors and senior writers
                  to alumni with real-world experience. These mentors provide one-on-one feedback, technical advice,
                  and creative insight, helping students shape their own editorial identity.
                </p>

                <h4 className="event-section__sub-heading">What We Hope to Accomplish</h4>
                <ul className="event-section__objectives-list">
                  {[
                    'Provide a comprehensive course with knowledge ranging from literary analysis to analytical edits',
                    'Cultivate a new generation of student editors, designers, and creative leaders',
                    'Provide authentic, hands-on publishing experience within collaboration',
                    'Equip participants with skills applicable to both literary and multimedia contexts',
                    'Construct lasting mentorship connections among Basis China network',
                  ].map(o => (
                    <li key={o}>
                      <span className="event-section__bullet">✦</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>

                <div className="event-section__cta-row">
                  <span className="overline" style={{ color: 'var(--color-accent)' }}>Learn · Write · Grow</span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <div className="page-divider" />

        {/* Annual Writing Contest */}
        <section className="event-section section">
          <Reveal>
            <div className="event-section__header">
              <span className="overline">Annual Competition</span>
              <h2>Annual Writing Contest</h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="event-section__card">
              <div className="event-section__card-left">
                <figure className="event-section__photo">
                  <img src="/images/event_writing_contest.jpg" alt="Annual Writing Contest" loading="lazy" />
                  <figcaption className="event-section__photo-caption">Annual · Writing Contest</figcaption>
                </figure>
              </div>
              <div className="event-section__card-right">
                <h3 className="event-section__card-title">Where Creativity Meets Debate, and Imagination Finds Its Voice</h3>
                <p className="event-section__card-body">
                  Welcome to the Mortals Annual Writing Contest — where creativity meets debate, and imagination
                  finds its voice. This one-of-a-kind literary event invites students from across the BASIS China
                  network to explore whimsical dilemmas, challenge their thinking, and transform their arguments into
                  captivating written and spoken performances.
                </p>

                <h4 className="event-section__sub-heading">The Process</h4>
                <div className="event-section__process">
                  <div className="event-section__process-step">
                    <span className="event-section__process-num">01</span>
                    <div>
                      <strong>Preliminary Round</strong>
                      <p>Individual writing contests under specific debate topics, where participants choose a topic of interest and take a stance.</p>
                    </div>
                  </div>
                  <div className="event-section__process-step">
                    <span className="event-section__process-num">02</span>
                    <div>
                      <strong>Final Round</strong>
                      <p>Teams of three compete through debate format, showcasing their arguments in a dynamic, high-energy setting.</p>
                    </div>
                  </div>
                </div>

                <div className="event-section__awards">
                  {[
                    { num: '8 campuses', label: 'participating' },
                    { num: '100+', label: 'submissions' },
                    { num: '8+', label: 'student & teacher judges' },
                    { num: '3', label: 'award categories' },
                  ].map(a => (
                    <div key={a.label} className="event-section__award">
                      <span className="event-section__award-num">{a.num}</span>
                      <span className="event-section__award-label">{a.label}</span>
                    </div>
                  ))}
                </div>

                <blockquote className="event-section__blockquote">
                  "At the heart of the Mortals Annual Writing Contest lies a simple belief: that powerful ideas
                  deserve a stage, and that writing, in all its quirky and compelling forms, can bring people together."
                </blockquote>
              </div>
            </div>
          </Reveal>
        </section>

      </div>
    </div>
  )
}
