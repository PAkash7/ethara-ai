import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import './AuthPages.css'

/* ── Floating orb component ───────────────────────────────────── */
function Orbs() {
  return (
    <div className="auth-orbs" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  )
}

/* ── Particle field ───────────────────────────────────────────── */
function Particles() {
  return (
    <div className="auth-particles" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            '--dx': `${(Math.random() - 0.5) * 200}px`,
            '--dy': `${(Math.random() - 0.5) * 200}px`,
            left: `${Math.random() * 100}%`,
            top:  `${Math.random() * 100}%`,
            animationDelay:    `${Math.random() * 8}s`,
            animationDuration: `${5 + Math.random() * 8}s`,
            width:  `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

/* ── Star field (night only) ──────────────────────────────────── */
function Stars() {
  const { theme } = useThemeStore()
  if (theme !== 'night') return null
  return (
    <div className="auth-stars" aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top:  `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            width:  `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const { login }               = useAuthStore()
  const navigate                = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login/', formData)
      const userRes  = await api.get('/api/auth/me/', {
        headers: { Authorization: `Bearer ${data.access}` },
      })
      login(data.access, data.refresh, userRes.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Orbs />
      <Particles />
      <Stars />

      <div className={`auth-card ${mounted ? 'auth-card--visible' : ''}`}>
        {/* Shimmer border */}
        <div className="auth-card-shimmer" />

        <div className="auth-header">
          <div className="auth-logo-wrap">
            <div className="auth-logo">⚡</div>
            <div className="auth-logo-ring" />
          </div>
          <h1 className="auth-title">
            <span className="auth-brand-name">Ethara.AI</span>
          </h1>
          <p className="auth-brand-byline">Dashboard by Akash Pandey</p>
          <p className="auth-subtitle">
            <em>Sign in to your workspace</em>
          </p>
        </div>

        {error && (
          <div className="alert alert-danger auth-alert" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group auth-field auth-field--1">
            <label htmlFor="login-username" className="form-label">
              Username
            </label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                id="login-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input auth-input"
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group auth-field auth-field--2">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input
                id="login-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input auth-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary auth-submit auth-field--3"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner" /> Signing in…
              </span>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p className="auth-footer auth-field--4">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

        <div className="auth-deco-line" />
      </div>
    </div>
  )
}
