import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import { buildLabelMap } from '../utils/designations'
import './ProfilePage.css'

const AVATAR_COLORS = [
  '#7c3aed', '#9333ea', '#6d28d9',
  '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777',
  '#4f46e5', '#0d9488', '#65a30d',
]

function Stat({ label, value }) {
  return (
    <div className="profile-stat">
      <div className="profile-stat-value">{value ?? 0}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  )
}

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore()   // ← use updateUser (not setUser)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  /* ── Fetch full profile ──────────────────────────────────────── */
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/auth/me/').then(r => r.data),
  })

  /* ── Fetch designations (grouped) ───────────────────────────── */
  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: () => api.get('/api/auth/designations/').then(r => r.data),
  })

  /* ── Fetch dashboard stats ───────────────────────────────────── */
  const { data: dashData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard/').then(r => r.data),
  })

  /* ── Initialise form when profile loads (v5-safe useEffect) ─── */
  useEffect(() => {
    if (profile && !form) {
      setForm({
        email:        profile.email        || '',
        first_name:   profile.first_name   || '',
        last_name:    profile.last_name    || '',
        designation:  profile.profile?.designation  || '',
        bio:          profile.profile?.bio          || '',
        phone:        profile.profile?.phone        || '',
        location:     profile.profile?.location     || '',
        avatar_color: profile.profile?.avatar_color || '#7c3aed',
      })
    }
  }, [profile])  // re-run only when profile loads

  /* ── Save mutation ───────────────────────────────────────────── */
  const updateMutation = useMutation({
    mutationFn: (data) => api.patch('/api/auth/me/', data),
    onSuccess: (res) => {
      updateUser({ ...authUser, ...res.data })        // ← updateUser not setUser
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setEditing(false)
      setSaved(true)
      setSaveError('')
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err) => {
      const d = err.response?.data
      const msg = typeof d === 'string' ? d
        : d?.detail || d?.non_field_errors?.[0]
        || Object.values(d || {})[0]?.[0]
        || 'Failed to save. Please try again.'
      setSaveError(msg)
    },
  })

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleEdit = () => {
    // Always reset form fresh from latest profile data
    setForm({
      email:        profile?.email                   || '',
      first_name:   profile?.first_name              || '',
      last_name:    profile?.last_name               || '',
      designation:  profile?.profile?.designation    || '',
      bio:          profile?.profile?.bio            || '',
      phone:        profile?.profile?.phone          || '',
      location:     profile?.profile?.location       || '',
      avatar_color: profile?.profile?.avatar_color   || '#7c3aed',
    })
    setSaveError('')
    setEditing(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form) return
    setSaveError('')
    updateMutation.mutate(form)
  }

  /* ── Derived display values ──────────────────────────────────── */
  const p = profile?.profile || {}
  const labelMap = buildLabelMap(designations)
  const displayName = profile
    ? ([profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username)
    : authUser?.username

  const initials     = displayName?.slice(0, 2).toUpperCase()
  const avatarColor  = form?.avatar_color || p?.avatar_color || '#7c3aed'

  /* ── Loading state ───────────────────────────────────────────── */
  if (isLoading) return (
    <div className="page-layout" style={{ flexDirection: 'column' }}>
      <Navbar />
      <div className="loading-container"><div className="spinner" /></div>
    </div>
  )

  return (
    <div className="page-layout" style={{ flexDirection: 'column' }}>
      <Navbar />
      <main className="main-content">

        {/* ── Hero Banner ──────────────────────────────────────── */}
        <div className="profile-hero">
          <div className="profile-hero-bg" />
          <div className="profile-hero-content">
            <div
              className="profile-avatar-lg"
              style={{ background: editing ? (form?.avatar_color || avatarColor) : avatarColor }}
            >
              {initials}
              {!editing && (
                <button
                  className="profile-avatar-edit-btn"
                  onClick={handleEdit}
                  title="Edit profile"
                >✎</button>
              )}
            </div>
            <div className="profile-hero-text">
              <h1 className="profile-display-name">{displayName}</h1>
              <p className="profile-designation-badge">
                🏷️ {labelMap[p.designation] || p.designation?.replace(/_/g,' ') || 'Professional'}
              </p>
              {p.location && (
                <p className="profile-location">📍 {p.location}</p>
              )}
            </div>
          </div>

          {/* Stat strip */}
          <div className="profile-stats-strip">
            <Stat label="Projects"    value={dashData?.total_projects} />
            <Stat label="Tasks Total" value={dashData?.total_tasks} />
            <Stat label="Completed"   value={dashData?.done} />
            <Stat label="In Progress" value={dashData?.in_progress} />
            <Stat label="Overdue"     value={dashData?.overdue} />
          </div>
        </div>

        {/* ── Save / Error Banner ──────────────────────────────── */}
        {saved && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            ✅ Profile updated successfully!
          </div>
        )}
        {saveError && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            ⚠️ {saveError}
          </div>
        )}

        {/* ── VIEW MODE ────────────────────────────────────────── */}
        {!editing ? (
          <div className="profile-grid">
            {/* Info card */}
            <div className="card">
              <div className="profile-section-title">Personal Information</div>
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="pf-label">Username</span>
                  <span className="pf-value">@{profile?.username}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Full Name</span>
                  <span className="pf-value">
                    {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Email</span>
                  <span className="pf-value">{profile?.email || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Phone</span>
                  <span className="pf-value">{p.phone || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Location</span>
                  <span className="pf-value">{p.location || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Designation</span>
                  <span className="pf-value">
                    {labelMap[p.designation] || p.designation?.replace(/_/g,' ') || '—'}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Member Since</span>
                  <span className="pf-value">
                    {profile?.date_joined
                      ? new Date(profile.date_joined).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
                {p.bio && (
                  <div className="profile-field profile-field-full">
                    <span className="pf-label">Bio</span>
                    <span className="pf-value pf-bio">{p.bio}</span>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={handleEdit}>
                ✎ Edit Profile
              </button>
            </div>

            {/* Account card */}
            <div className="card">
              <div className="profile-section-title">Account Settings</div>
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="pf-label">Role</span>
                  <span className="pf-value">
                    <span className={`role-chip ${profile?.is_superuser ? 'superuser' : profile?.is_staff ? 'staff' : 'user'}`}>
                      {profile?.is_superuser ? '👑 Superuser' : profile?.is_staff ? '⚙️ Staff / Admin' : '👤 Team Member'}
                    </span>
                  </span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Avatar Colour</span>
                  <span className="pf-value">
                    <span
                      style={{
                        display: 'inline-block', width: 22, height: 22,
                        borderRadius: '50%', background: avatarColor,
                        border: '2px solid var(--border)', verticalAlign: 'middle',
                        marginRight: 8,
                      }}
                    />
                    {avatarColor}
                  </span>
                </div>
              </div>

              <div className="profile-section-title" style={{ marginTop: 28 }}>Quick Links</div>
              <div className="profile-quick-links">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
                  📊 Dashboard
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
                  📁 My Projects
                </button>
                {profile?.is_staff && (
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin-panel')}>
                    👑 Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>

        ) : (
          /* ── EDIT MODE ───────────────────────────────────────── */
          <form className="card profile-edit-form" onSubmit={handleSave}>
            <div className="profile-section-title">Edit Profile</div>

            {form && (
              <div className="profile-form-grid">
                <div className="form-field">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-input"
                    value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-input"
                    value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 …"
                  />
                </div>
                <div className="form-field form-field-full">
                  <label className="form-label">Designation / Role</label>
                  <select
                    className="form-input"
                    value={form.designation}
                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  >
                    <option value="">— Select your role in the company —</option>
                    {designations?.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options?.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field-full">
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
                <div className="form-field form-field-full">
                  <label className="form-label">
                    Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(max 300 chars)</span>
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    maxLength={300}
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="A short bio about yourself…"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Avatar colour picker */}
                <div className="form-field form-field-full">
                  <label className="form-label">Avatar Colour</label>
                  <div className="color-swatches">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${form.avatar_color === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        onClick={() => setForm(f => ({ ...f, avatar_color: color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="profile-edit-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateMutation.isPending || !form}
              >
                {updateMutation.isPending ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="btn-spinner" /> Saving…
                  </span>
                ) : '✓ Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setEditing(false); setSaveError('') }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
