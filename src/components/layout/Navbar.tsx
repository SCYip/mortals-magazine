import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, Search } from 'lucide-react'
import './Navbar.css'

type Sub = { label: string; to: string }
type NavItem = { label: string; to: string; sub?: Sub[] }

const LINKS: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Events / Contests', to: '/events-contests' },
  {
    label: 'Genres', to: '/all-articles',
    sub: [
      { label: 'All Articles', to: '/all-articles' },
      { label: 'Nonfiction', to: '/all-articles/categories/nonfiction' },
      { label: 'Fiction (Poetry)', to: '/all-articles/categories/fiction-poetry' },
      { label: 'Fiction (Prose)', to: '/all-articles/categories/fiction-prose' },
      { label: 'Reviews', to: '/all-articles/categories/review' },
    ],
  },
  {
    label: 'Columns', to: '/column/inkmagination',
    sub: [
      { label: 'Whale Done · UN SDGs', to: '/column/whale-done' },
      { label: 'Inkmagination', to: '/column/inkmagination' },
      { label: 'Fourteenlines', to: '/column/fourteenlines' },
      { label: 'Astronomical', to: '/column/astronomical' },
    ],
  },
  { label: 'Volumes', to: '/volumes' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [hoverSub, setHoverSub] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Debounced hover-leave so the cursor can cross the gap to the dropdown
  // without the dropdown unmounting mid-traversal
  const enterSub = (label: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setHoverSub(label)
  }
  const leaveSub = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setHoverSub(null), 160)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setHoverSub(null)
    setSearchOpen(false)
  }, [location.pathname])

  // Focus the input when the search bar opens
  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 60)
      return () => clearTimeout(id)
    }
  }, [searchOpen])

  // Esc closes the search overlay
  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) navigate(`/all-articles?q=${encodeURIComponent(q)}`)
    else navigate('/all-articles')
    setSearchOpen(false)
    setSearchQuery('')
  }

  const isHome = location.pathname === '/'

  return (
    <header className={['nav', (scrolled || !isHome) ? 'nav--solid' : '', open ? 'nav--open' : ''].join(' ')}>
      <div className="container container--wide nav__inner">
        <Link to="/" className="nav__brand" aria-label="The Mortals — home">
          <img
            src="/images/logo_transparent.png"
            alt=""
            className="nav__brand-logo"
            aria-hidden="true"
          />
          <span className="nav__brand-text">
            <span className="nav__brand-name">The Mortals</span>
            <span className="nav__brand-sub">BASIS China</span>
          </span>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map(l => (
            <div
              key={l.label}
              className="nav__item"
              onMouseEnter={() => l.sub && enterSub(l.label)}
              onMouseLeave={() => l.sub && leaveSub()}
            >
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => ['nav__link', isActive ? 'nav__link--active' : ''].join(' ')}
              >
                {l.label}
                {l.sub && <ChevronDown size={12} className="nav__caret" />}
              </NavLink>
              {l.sub && hoverSub === l.label && (
                <div className="nav__dropdown">
                  {l.sub.map(s => (
                    <Link key={s.to} to={s.to} className="nav__dropdown-link">{s.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="nav__cta">
          <form
            className={`nav__search ${searchOpen ? 'nav__search--open' : ''}`}
            onSubmit={submitSearch}
            role="search"
          >
            <button
              type="button"
              className="nav__search-trigger"
              onClick={() => setSearchOpen(v => !v)}
              aria-label={searchOpen ? 'Close search' : 'Search articles'}
              aria-expanded={searchOpen}
            >
              <Search size={16} />
            </button>
            <input
              ref={searchInputRef}
              type="search"
              className="nav__search-input"
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
              aria-label="Search articles"
              tabIndex={searchOpen ? 0 : -1}
            />
          </form>
          <a
            href="https://forms.cloud.microsoft/r/82x3JkRjBR"
            target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            Submit
          </a>
          <Link to="/join" className="btn btn-primary btn-sm">
            Join Us
          </Link>
        </div>

        <button
          className="nav__burger"
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className="nav__drawer" role="dialog" aria-hidden={!open}>
        <nav className="nav__drawer-links">
          {LINKS.map(l => (
            <div key={l.label}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => ['nav__drawer-link', isActive ? 'nav__drawer-link--active' : ''].join(' ')}
              >
                {l.label}
              </NavLink>
              {l.sub && (
                <div className="nav__drawer-sub">
                  {l.sub.map(s => (
                    <NavLink key={s.to} to={s.to} className="nav__drawer-sublink">{s.label}</NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="nav__drawer-cta">
            <a
              href="https://forms.cloud.microsoft/r/82x3JkRjBR"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost"
            >Submit</a>
            <Link to="/join" className="btn btn-primary">Join Us</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
