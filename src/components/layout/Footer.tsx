import { Link } from 'react-router-dom'
import { Mail, Instagram, Github, ExternalLink } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer__top-rule" aria-hidden="true" />
      <div className="container container--wide footer__inner">
        <div className="footer__col footer__col--brand">
          <div className="footer__brand">
            <img
              src="/images/logo_transparent.png"
              alt=""
              className="footer__brand-logo"
              aria-hidden="true"
            />
            <div>
              <div className="footer__brand-name">The Mortals</div>
              <div className="footer__brand-sub">BASIS China · Literary Magazine</div>
            </div>
          </div>
          <p className="footer__tag">
            A student-led literary project dedicated to fiction, essays, creative nonfiction, poetry,
            memoirs, and beyond — spanning eleven BASIS China schools.
          </p>
          <div className="footer__social">
            <a href="mailto:themortals@basischina.com" aria-label="Email" className="footer__social-link"><Mail size={16} /></a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer__social-link"><Instagram size={16} /></a>
            <a href="https://github.com/johnny1003" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="footer__social-link"><Github size={16} /></a>
          </div>
        </div>

        <div className="footer__col">
          <h4 className="footer__title">Magazine</h4>
          <ul className="footer__list">
            <li><Link to="/all-articles">All Articles</Link></li>
            <li><Link to="/all-articles/categories/nonfiction">Nonfiction</Link></li>
            <li><Link to="/all-articles/categories/fiction-prose">Fiction Prose</Link></li>
            <li><Link to="/all-articles/categories/fiction-poetry">Fiction Poetry</Link></li>
            <li><Link to="/all-articles/categories/review">Reviews</Link></li>
            <li><Link to="/volumes">Volumes</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__title">Programs</h4>
          <ul className="footer__list">
            <li><Link to="/events-contests">Writing Contests</Link></li>
            <li><Link to="/events-contests">Writing Courses</Link></li>
            <li><Link to="/events-contests">Writers' Workshops</Link></li>
            <li><Link to="/column/inkmagination">Inkmagination</Link></li>
            <li><Link to="/column/whale-done">Whale Done</Link></li>
            <li><Link to="/column/astronomical">Astronomical</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__title">Get Involved</h4>
          <ul className="footer__list">
            <li>
              <a href="https://forms.office.com/pages/responsepage.aspx?id=4uHGy7umAkC73G2okqBRp6xsy5ePBBNGqQHOmRnLOqhUM1VMMjFIWDVVMU1OOUhIMFA4WUIyS05DMy4u" target="_blank" rel="noopener noreferrer">
                Submit Your Work <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <Link to="/join">Join the Team</Link>
            </li>
            <li><Link to="/about">About Us</Link></li>
            <li><a href="mailto:themortals@basischina.com">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__base">
        <div className="container container--wide footer__base-inner">
          <span>© {year} The Mortals Magazine · All rights reserved.</span>
          <span className="footer__motto">"Beyond our limitations as mortals."</span>
        </div>
      </div>
    </footer>
  )
}
