import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { LogOut, FileText, BookOpen, Image as ImageIcon, Users, Crown } from 'lucide-react'
import { useAuth, AuthProvider } from './lib/auth'
import { useRole } from './lib/role'
import LoginPage from './pages/LoginPage'
import ArticlesPanel from './pages/ArticlesPanel'
import VolumesPanel from './pages/VolumesPanel'
import HeroPanel from './pages/HeroPanel'
import TeamAlumniPanel from './pages/TeamAlumniPanel'
import EditorsPanel from './pages/EditorsPanel'
import { ErrorBoundary } from './components/ErrorBoundary'

const BASE_NAV = [
  { to: '/articles',   label: 'Articles',       icon: FileText },
  { to: '/volumes',    label: 'Volumes',        icon: BookOpen },
  { to: '/hero',       label: 'Hero rotation',  icon: ImageIcon },
  { to: '/people',     label: 'Team & Alumni',  icon: Users },
] as const

const CHIEF_NAV = [
  { to: '/editors',    label: 'Editors',        icon: Crown },
] as const

function Shell({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth()
  const { isChief } = useRole()
  const location = useLocation()
  const nav = isChief ? [...BASE_NAV, ...CHIEF_NAV] : BASE_NAV
  return (
    <div className="shell">
      <aside className="shell__aside">
        <div className="shell__brand">
          <div className="shell__brand-name">The Mortals</div>
          <div className="shell__brand-sub">Editor Panel</div>
        </div>
        <nav className="shell__nav">
          {nav.map(item => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} className={`shell__nav-link ${active ? 'is-active' : ''}`}>
                <Icon size={16} strokeWidth={1.6} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="shell__foot">
          <div className="shell__user">
            {session?.user.email}
            {isChief && <span className="shell__user-badge"><Crown size={10} /> Chief</span>}
          </div>
          <button className="shell__signout" onClick={signOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="shell__main">{children}</main>
    </div>
  )
}

function Protected({ children, label }: { children: React.ReactNode; label?: string }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return <Shell><ErrorBoundary label={label}>{children}</ErrorBoundary></Shell>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/articles" replace />} />
        <Route path="/articles/*" element={<Protected label="Articles"><ArticlesPanel /></Protected>} />
        <Route path="/volumes/*" element={<Protected label="Volumes"><VolumesPanel /></Protected>} />
        <Route path="/hero" element={<Protected label="Hero"><HeroPanel /></Protected>} />
        <Route path="/people" element={<Protected label="Team & Alumni"><TeamAlumniPanel /></Protected>} />
        <Route path="/editors" element={<Protected label="Editors"><EditorsPanel /></Protected>} />
        <Route path="*" element={<Navigate to="/articles" replace />} />
      </Routes>
    </AuthProvider>
  )
}
