import { Link } from 'react-router-dom'
import Reveal from '../ui/Reveal'
import './VolumeSection.css'

export default function VolumeSection() {
  return (
    <section className="volume section section--deep">
      <div className="container container--wide">
        <Reveal>
          <div className="volume__head">
            <span className="overline">Current Volume</span>
            <h2 className="volume__title">A Year of Literary Exploration</h2>
            <div className="volume__seasons">
              <span>Fall</span>
              <span className="volume__sep">/</span>
              <span className="volume__season--active">Winter</span>
              <span className="volume__sep">/</span>
              <span>Spring</span>
              <span className="volume__year">2025 – 2026</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <article className="volume__card">
            <div className="volume__cover">
              <span className="volume__spine vertical-mark" aria-hidden="true">
                Volume III · MMXXV–XXVI
              </span>
              <img
                src="/images/volume_winter_2026.png"
                alt="The Mortals — current volume cover"
                loading="lazy"
              />
              <span className="volume__cover-frame" aria-hidden="true" />
            </div>

            <div className="volume__content">
              <span className="kicker">An annual reading commitment</span>
              <h3 className="volume__content-title">
                Three issues. One unifying theme. <em>An entire year</em> of student voices.
              </h3>
              <p className="volume__content-body">
                The Mortals runs a quarterly magazine funded, printed, and distributed across eleven
                BASIS China schools. Each school year, the editorial board decides on a unifying
                theme for the volume — an abstract concept that propels reasoning and imagination.
                Each of the three issues explores and examines an aspect of that theme.
              </p>

              <div className="volume__facts">
                <div className="volume__fact"><span className="volume__fact-num">3</span><span className="volume__fact-label">Seasonal issues</span></div>
                <div className="volume__fact"><span className="volume__fact-num">11</span><span className="volume__fact-label">Campuses</span></div>
                <div className="volume__fact"><span className="volume__fact-num">1</span><span className="volume__fact-label">Shared theme</span></div>
              </div>

              <div className="volume__cta">
                <Link to="/volumes" className="btn btn-primary">Explore Volumes</Link>
                <Link to="/all-articles" className="btn btn-ghost">Read the Issues</Link>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
