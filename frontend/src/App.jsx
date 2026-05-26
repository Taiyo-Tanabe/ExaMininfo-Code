import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider } from './AuthContext'
import { api } from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SchoolsPage from './pages/SchoolsPage'
import SchoolDetailPage from './pages/SchoolDetailPage'
import IncidentsPage from './pages/IncidentsPage'
import PostsPage from './pages/PostsPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import AccountPage from './pages/AccountPage'
import UserProfilePage from './pages/UserProfilePage'
import AboutPage from './pages/AboutPage'
import LegalPage from './pages/LegalPage'
import PostDetailPage from './pages/PostDetailPage'
import AvatarEditPage from './pages/AvatarEditPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import EventFormPage from './pages/EventFormPage'
import OrgsPage from './pages/OrgsPage'
import OrgDetailPage from './pages/OrgDetailPage'
import OrgFormPage from './pages/OrgFormPage'
import OrgDashboardPage from './pages/OrgDashboardPage'
import OrgIconEditPage from './pages/OrgIconEditPage'

function UserByNamePage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.searchUsers(name, 5).then(d => {
      const match = d.items.find(u => u.name === name) ?? d.items[0]
      if (match) navigate(`/users/${match.id}`, { replace: true })
      else setNotFound(true)
    }).catch(() => setNotFound(true))
  }, [name])

  if (notFound) return <div className="container"><p className="muted" style={{ padding: '3rem', textAlign: 'center' }}>ユーザーが見つかりません: @{name}</p></div>
  return <div className="container"><div className="loading">読み込み中...</div></div>
}

function SiteNameEffect() {
  useEffect(() => {
    api.getSiteContent('site_name').then(d => {
      if (d.value) document.title = d.value
    }).catch(() => {})
  }, [])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SiteNameEffect />
        <Navbar />
        <Routes>
          <Route path="/"                       element={<SchoolsPage />} />
          <Route path="/schools/:id"            element={<SchoolDetailPage />} />
          <Route path="/incidents"              element={<IncidentsPage />} />
          <Route path="/posts"                  element={<PostsPage />} />
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/admin"                  element={<AdminPage />} />
          <Route path="/account"                element={<AccountPage />} />
          <Route path="/account/avatar"         element={<AvatarEditPage />} />
          <Route path="/posts/:postId"           element={<PostDetailPage />} />
          <Route path="/users/by-name/:name"    element={<UserByNamePage />} />
          <Route path="/users/:userId"          element={<UserProfilePage />} />
          <Route path="/about"                  element={<AboutPage />} />
          <Route path="/legal"                  element={<LegalPage />} />
          <Route path="/events"                        element={<EventsPage />} />
          <Route path="/events/new"                   element={<EventFormPage />} />
          <Route path="/events/:eventId"              element={<EventDetailPage />} />
          <Route path="/events/:eventId/edit"         element={<EventFormPage />} />
          <Route path="/orgs"                         element={<OrgsPage />} />
          <Route path="/orgs/new"                     element={<OrgFormPage />} />
          <Route path="/orgs/:orgId"                  element={<OrgDetailPage />} />
          <Route path="/orgs/:orgId/edit"             element={<OrgFormPage />} />
          <Route path="/orgs/:orgId/dashboard"        element={<OrgDashboardPage />} />
          <Route path="/orgs/:orgId/icon"            element={<OrgIconEditPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}
