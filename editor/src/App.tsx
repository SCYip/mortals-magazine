import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { LogOut, FileText, BookOpen, Image as ImageIcon, Users } from 'lucide-react'
import { useAuth } from './lib/auth'
import LoginPage from './pages/LoginPage'
import ArticlesPanel from './pages/ArticlesPanel'
import VolumesPanel from './pages/VolumesPanel'
import HeroPanel from './pages/HeroPanel'
import TeamAlumniPanel from './pages/TeamAlumniPanel'

const NAV = [
  { to: '/articles',   label: 'Articles',       icon: FileText },
  { to: '/volumes',    label: 'Volumes',        icon: BookOpen },
  { to: '/hero',       label: 'Hero rotation',  icon: ImageIcon },
  { to: '/people',     label: 'Team & Alumni',  icon: Users },
]

function Shell({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth()
  const location = useLocation()
  return (
    <div className="shell">
      <aside className="shell__aside">
        <div className="shell__brand">
          <div className="shell__brand-name">The Mortals</div>
          <div className="shell__brand-sub">Editor Panel</div>
        </div>
        <nav className="shell__nav">
          {NAV.map(item => {
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
          <div className="shell__user">{session?.user.email}</div>
          <button className="shell__signout" onClick={signOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="shell__main">{children}</main>
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return <Shell>{children}</Shell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/articles" replace />} />
      <Route path="/articles/*" element={<Protected><ArticlesPanel /></Protected>} />
      <Route path="/volumes/*" element={<Protected><VolumesPanel /></Protected>} />
      <Route path="/hero" element={<Protected><HeroPanel /></Protected>} />
      <Route path="/people" element={<Protected><TeamAlumniPanel /></Protected>} />
      <Route path="*" element={<Navigate to="/articles" replace />} />
    </Routes>
  )
}
