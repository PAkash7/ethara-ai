import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import './AuthPages.css'

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

function Stars() {
  const { theme } = useThemeStore()
  if (theme !== 'night') return null
  return (
    <div className="auth-stars" aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => (
        <span key={i} className="star" style={{
          left: `${Math.random() * 100}%`,
          top:  `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${2 + Math.random() * 3}s`,
          width:  `${1 + Math.random() * 2}px`,
          height: `${1 + Math.random() * 2}px`,
        }} />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '', designation: '',
  })
  const [designations, setDesignations] = useState([])
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { login }             = useAuthStore()
  const navigate              = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    // Fetch grouped designations
    fetch('/api/auth/designations/')
      .then(r => r.json())
      .then(setDesignations)
      .catch(() => {})
    return () => clearTimeout(t)
  }, [])

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (formData.password !== formData.password2) {
      setErrors({ password2: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register/', formData)
      login(data.access, data.refresh, data.user)
      navigate('/dashboard')
    } catch (err) {
      const resp = err.response?.data || {}
      const mapped = {}
      Object.entries(resp).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : v
      })
      setErrors(mapped)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Orbs />
      <Particles />
      <Stars />

      <div className={`auth-card auth-card--wide ${mounted ? 'auth-card--visible' : ''}`}>
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
          <p className="auth-subtitle"><em>Create your account to get started</em></p>
        </div>

        {errors.non_field_errors && (
          <div className="alert alert-danger auth-alert">⚠️ {errors.non_field_errors}</div>
        )}

        <form id="register-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-grid-2">
            <div className="form-group auth-field auth-field--1">
              <label htmlFor="reg-username" className="form-label">Username</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  id="reg-username" type="text" name="username"
                  value={formData.username} onChange={handleChange}
                  className="form-input auth-input" placeholder="Choose a username"
                  autoComplete="username" required
                />
              </div>
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>

            <div className="form-group auth-field auth-field--2">
              <label htmlFor="reg-email" className="form-label">Email</label>
              <div className="input-wrap">
                <span className="input-icon">✉️</span>
                <input
                  id="reg-email" type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  className="form-input auth-input" placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>

          {/* Designation — full width */}
          <div className="form-group auth-field auth-field--3" style={{ gridColumn: '1/-1' }}>
            <label htmlFor="reg-designation" className="form-label">
              Your Role / Designation
            </label>
            <div className="input-wrap">
              <span className="input-icon">🏷️</span>
              <select
                id="reg-designation" name="designation"
                value={formData.designation} onChange={handleChange}
                className="form-input auth-input"
              >
                <option value="">— Select your role in the company —</option>
                {designations.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="auth-grid-2">
            <div className="form-group auth-field auth-field--4">
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔑</span>
                <input
                  id="reg-password" type="password" name="password"
                  value={formData.password} onChange={handleChange}
                  className="form-input auth-input" placeholder="Min. 8 characters"
                  autoComplete="new-password" required
                />
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group auth-field auth-field--5">
              <label htmlFor="reg-password2" className="form-label">Confirm</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  id="reg-password2" type="password" name="password2"
                  value={formData.password2} onChange={handleChange}
                  className="form-input auth-input" placeholder="Repeat password"
                  autoComplete="new-password" required
                />
              </div>
              {errors.password2 && <span className="form-error">{errors.password2}</span>}
            </div>
          </div>

          <button
            id="register-submit-btn" type="submit"
            className="btn btn-primary auth-submit auth-field--6"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading"><span className="btn-spinner" /> Creating account…</span>
            ) : 'Create Account →'}
          </button>
        </form>

        <p className="auth-footer auth-field--7">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-deco-line" />
      </div>
    </div>
  )
}
