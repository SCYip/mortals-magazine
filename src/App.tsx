import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import EventsContestsPage from './pages/EventsContestsPage'
import AllArticlesPage from './pages/AllArticlesPage'
import ArticlePage from './pages/ArticlePage'
import GenrePage from './pages/GenrePage'
import ColumnPage from './pages/ColumnPage'
import AboutPage from './pages/AboutPage'
import VolumesPage from './pages/VolumesPage'
import ScrollToTop from './components/ui/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <main>
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
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
