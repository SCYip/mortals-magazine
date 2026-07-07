import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import ScrollToTop from './components/ui/ScrollToTop'

// Route-level code splitting: only the home page ships in the entry
// bundle; every other page loads on demand. Cuts the first-visit JS
// without changing anything visual.
const EventsContestsPage = lazy(() => import('./pages/EventsContestsPage'))
const AllArticlesPage = lazy(() => import('./pages/AllArticlesPage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const GenrePage = lazy(() => import('./pages/GenrePage'))
const ColumnPage = lazy(() => import('./pages/ColumnPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const VolumesPage = lazy(() => import('./pages/VolumesPage'))
const IssuePage = lazy(() => import('./pages/IssuePage'))
const JoinPage = lazy(() => import('./pages/JoinPage'))

function RouteFallback() {
  return (
    <div className="route-fallback" aria-busy="true">
      <span className="route-fallback__mark">✦</span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events-contests" element={<EventsContestsPage />} />
            <Route path="/all-articles" element={<AllArticlesPage />} />
            <Route path="/all-articles/:slug" element={<ArticlePage />} />
            <Route path="/all-articles/categories/:genre" element={<GenrePage />} />
            <Route path="/column/:slug" element={<ColumnPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/volumes" element={<VolumesPage />} />
            <Route path="/volumes/:slug" element={<VolumesPage />} />
            <Route path="/volumes/:volSlug/issue/:issueSlug" element={<IssuePage />} />
            <Route path="/join" element={<JoinPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
