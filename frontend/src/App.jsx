import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AdminPanel from './pages/AdminPanel'
import AccessDenied from './pages/AccessDenied'
import ProfilePage from './pages/ProfilePage'
import './transitions.css'

/** Scroll to top + apply fade-in class on every route change */
function RouteTransition({ children }) {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTransition>
        <Routes>
          {/* ── Public ───────────────────────────────────── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected ────────────────────────────────── */}
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />
          <Route path="/projects" element={
            <PrivateRoute><ProjectsPage /></PrivateRoute>
          } />
          <Route path="/projects/:id" element={
            <PrivateRoute><ProjectDetailPage /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />

          {/* ── Admin ────────────────────────────────────── */}
          <Route path="/admin-panel" element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />

          {/* ── 403 & Redirects ──────────────────────────── */}
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/"   element={<Navigate to="/dashboard" replace />} />
          <Route path="*"   element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </RouteTransition>
    </BrowserRouter>
  )
}
