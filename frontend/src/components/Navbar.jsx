import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { formatDesignation } from '../utils/designations'
import './Navbar.css'

export default function Navbar() {
  const { user, logout }          = useAuthStore()
  const { theme, toggleTheme, initTheme } = useThemeStore()
  const location  = useLocation()
  const navigate  = useNavigate()

  // Apply theme on first render
  useEffect(() => { initTheme() }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  const isNight = theme === 'night'

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" className="brand-link">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Ethara.AI</span>
        </Link>
      </div>

      <div className="navbar-links">
        <Link
          to="/dashboard"
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <span>📊</span> Dashboard
        </Link>
        <Link
          to="/projects"
          className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
        >
          <span>📁</span> Projects
        </Link>
        {user?.is_staff && (
          <Link
            to="/admin-panel"
            className={`nav-link nav-link-admin ${isActive('/admin-panel') ? 'active' : ''}`}
          >
            <span>👑</span> Admin Panel
          </Link>
        )}
      </div>

      <div className="navbar-user">
        {/* Day / Night Toggle */}
        <button
          id="theme-toggle-btn"
          className="theme-toggle"
          onClick={toggleTheme}
          title={isNight ? 'Switch to Day mode' : 'Switch to Night mode'}
          aria-label="Toggle theme"
        >
          <div className={`toggle-track ${isNight ? 'night' : 'day'}`}>
            <span className="toggle-icon night-icon">🌙</span>
            <span className="toggle-icon day-icon">☀️</span>
            <div className="toggle-thumb" />
          </div>
        </button>

        <Link to="/profile" className="user-info user-info-link" title="View profile">
          <div
            className="user-avatar"
            style={{
              background: user?.profile?.avatar_color || '#7c3aed',
              boxShadow: `0 0 12px ${user?.profile?.avatar_color || '#7c3aed'}66`,
            }}
          >
            {initials}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.username || 'User'}</span>
            <span className="user-email">
              {user?.profile?.designation
                ? formatDesignation(user.profile.designation)
                : user?.email || 'View profile'}
            </span>
          </div>
        </Link>
        <button id="logout-btn" className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}
