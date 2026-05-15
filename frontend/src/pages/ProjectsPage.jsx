import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import './ProjectsPage.css'

const CATEGORY_META = {
  web_development:   { icon: '🌐', label: 'Web Development',      color: '#3b82f6' },
  mobile_app:        { icon: '📱', label: 'Mobile App',           color: '#8b5cf6' },
  data_science:      { icon: '📊', label: 'Data Science & ML',    color: '#06b6d4' },
  ui_ux_design:      { icon: '🎨', label: 'UI/UX Design',         color: '#ec4899' },
  devops:            { icon: '⚙️', label: 'DevOps & Infra',       color: '#f59e0b' },
  ecommerce:         { icon: '🛒', label: 'E-Commerce',           color: '#10b981' },
  marketing:         { icon: '📣', label: 'Digital Marketing',    color: '#f97316' },
  consulting:        { icon: '💼', label: 'Consulting',           color: '#6366f1' },
  research:          { icon: '🔬', label: 'Research',             color: '#14b8a6' },
  api_integration:   { icon: '🔌', label: 'API & Integrations',  color: '#7c3aed' },
  security:          { icon: '🔒', label: 'Cybersecurity',        color: '#dc2626' },
  blockchain:        { icon: '⛓️', label: 'Blockchain',           color: '#d97706' },
  iot:               { icon: '🤖', label: 'IoT & Embedded',       color: '#059669' },
  other:             { icon: '📌', label: 'Other',                color: '#6b7280' },
}

const STATUS_META = {
  active:    { label: 'Active',     color: '#10b981' },
  on_hold:   { label: 'On Hold',    color: '#f59e0b' },
  completed: { label: 'Completed',  color: '#3b82f6' },
  archived:  { label: 'Archived',  color: '#6b7280' },
}

const PRIORITY_META = {
  low:      { label: 'Low',      dot: '🟢' },
  medium:   { label: 'Medium',   dot: '🟡' },
  high:     { label: 'High',     dot: '🟠' },
  critical: { label: 'Critical', dot: '🔴' },
}

/* ── Project Card ───────────────────────────────────────────── */
function ProjectCard({ project, onClick }) {
  const cat  = CATEGORY_META[project.category] || CATEGORY_META.other
  const st   = STATUS_META[project.status] || STATUS_META.active
  const pri  = PRIORITY_META[project.priority] || PRIORITY_META.medium
  const done = project.done_count || 0
  const total = project.task_count || 0
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0
  const isOverdue = project.is_overdue

  return (
    <div
      className={`project-card ${isOverdue ? 'project-card-overdue' : ''}`}
      onClick={() => onClick(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(project)}
    >
      {/* Top accent bar */}
      <div className="project-card-accent" style={{ background: cat.color }} />

      {/* Header row */}
      <div className="project-card-head">
        <div className="project-cat-icon" style={{ background: cat.color + '22', color: cat.color }}>
          {cat.icon}
        </div>
        <div className="project-status-dot" style={{ background: st.color }} title={st.label} />
      </div>

      {/* Name + description */}
      <h3 className="project-name">{project.name}</h3>
      {project.description && (
        <p className="project-desc">{project.description}</p>
      )}

      {/* Category & Priority chips */}
      <div className="project-chips">
        <span className="project-chip" style={{ color: cat.color, borderColor: cat.color + '44', background: cat.color + '11' }}>
          {cat.icon} {cat.label}
        </span>
        <span className="project-chip">
          {pri.dot} {pri.label}
        </span>
      </div>

      {/* Client */}
      {project.client_name && (
        <div className="project-client">
          <span className="project-client-label">Client</span>
          <span className="project-client-name">{project.client_name}</span>
        </div>
      )}

      {/* Tech stack tags */}
      {project.tech_tags?.length > 0 && (
        <div className="project-tech-tags">
          {project.tech_tags.slice(0, 4).map(tag => (
            <span key={tag} className="tech-tag">{tag}</span>
          ))}
          {project.tech_tags.length > 4 && (
            <span className="tech-tag tech-tag-more">+{project.tech_tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="project-progress">
          <div className="project-progress-header">
            <span>Progress</span>
            <span>{done}/{total} tasks</span>
          </div>
          <div className="project-progress-bar">
            <div
              className="project-progress-fill"
              style={{ width: `${pct}%`, background: cat.color }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="project-footer">
        <div className="owner-avatar">
          {project.owner?.username?.slice(0, 2).toUpperCase() || 'U'}
        </div>
        <span className="owner-name">{project.owner?.username}</span>
        {project.deadline && (
          <span className={`project-deadline ${isOverdue ? 'deadline-overdue' : ''}`}>
            📅 {new Date(project.deadline + 'T00:00:00').toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short'
            })}
          </span>
        )}
        <span className="project-members-count">
          👥 {project.members?.length || 0}
        </span>
      </div>
    </div>
  )
}

/* ── New Project Modal ──────────────────────────────────────── */
function NewProjectModal({ onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'web_development',
    status: 'active', priority: 'medium',
    client_name: '', client_email: '', deadline: '',
    budget: '', tech_stack: '',
  })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/projects/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    },
    onError: (err) => {
      const d = err.response?.data || {}
      setError(d.name?.[0] || d.non_field_errors?.[0] || 'Failed to create project.')
    },
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Project name is required.'); return }
    const payload = { ...form }
    if (!payload.budget) delete payload.budget
    if (!payload.deadline) delete payload.deadline
    mutation.mutate(payload)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        <form id="new-project-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            {/* Name */}
            <div className="form-group modal-col-full">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')}
                placeholder="e.g. Acme E-Commerce Platform" autoFocus required />
            </div>

            {/* Category + Status */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={set('category')}>
                {Object.entries(CATEGORY_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={set('status')}>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Priority + Deadline */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={set('priority')}>
                {Object.entries(PRIORITY_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.dot} {m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={set('deadline')} />
            </div>

            {/* Client name + email */}
            <div className="form-group">
              <label className="form-label">Client / Organisation</label>
              <input className="form-input" value={form.client_name} onChange={set('client_name')}
                placeholder="Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Client Email</label>
              <input className="form-input" type="email" value={form.client_email} onChange={set('client_email')}
                placeholder="client@company.com" />
            </div>

            {/* Budget */}
            <div className="form-group">
              <label className="form-label">Budget (₹)</label>
              <input className="form-input" type="number" value={form.budget} onChange={set('budget')}
                placeholder="e.g. 500000" min="0" />
            </div>

            {/* Tech stack */}
            <div className="form-group">
              <label className="form-label">Tech Stack <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
              <input className="form-input" value={form.tech_stack} onChange={set('tech_stack')}
                placeholder="React, Django, PostgreSQL" />
            </div>

            {/* Description */}
            <div className="form-group modal-col-full">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} value={form.description} onChange={set('description')}
                placeholder="Project scope, goals, deliverables…" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="create-project-btn" type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : '✓ Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
const ALL_CATEGORIES = [{ value: '', label: 'All Categories', icon: '🗂️' }]
  .concat(Object.entries(CATEGORY_META).map(([v, m]) => ({ value: v, label: m.label, icon: m.icon })))

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  ...Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
]

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [showModal,   setShowModal]   = useState(false)
  const [catFilter,   setCatFilter]   = useState('')
  const [statFilter,  setStatFilter]  = useState('')
  const [search,      setSearch]      = useState('')

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects/').then(r => r.data),
  })

  const filtered = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => {
      const matchCat  = !catFilter  || p.category === catFilter
      const matchStat = !statFilter || p.status   === statFilter
      const matchSearch = !search   || p.name.toLowerCase().includes(search.toLowerCase())
        || p.client_name?.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchStat && matchSearch
    })
  }, [projects, catFilter, statFilter, search])

  // Stats summary
  const stats = useMemo(() => {
    if (!projects) return {}
    return {
      total:     projects.length,
      active:    projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      overdue:   projects.filter(p => p.is_overdue).length,
    }
  }, [projects])

  return (
    <div className="page-layout" style={{ flexDirection: 'column' }}>
      <Navbar />
      <main className="main-content">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              <em>{stats.total || 0} projects · {stats.active || 0} active · {stats.completed || 0} completed
              {stats.overdue > 0 && <span style={{ color: 'var(--danger-text)' }}> · ⚠️ {stats.overdue} overdue</span>}
              </em>
            </p>
          </div>
          <button id="new-project-modal-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>

        {/* Filters Bar */}
        <div className="projects-filters">
          <input
            className="form-input projects-search"
            placeholder="🔍 Search by name or client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-input projects-filter-select"
            value={statFilter} onChange={e => setStatFilter(e.target.value)}>
            {STATUS_FILTERS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Category tab bar */}
        <div className="category-tabs">
          {ALL_CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`category-tab ${catFilter === c.value ? 'active' : ''}`}
              onClick={() => setCatFilter(c.value)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="loading-container"><div className="spinner" /><p>Loading projects…</p></div>
        )}
        {isError && (
          <div className="alert alert-danger">⚠️ Failed to load projects.</div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>{projects?.length === 0 ? 'No projects yet' : 'No matching projects'}</h3>
            <p>
              {projects?.length === 0
                ? 'Create your first project to get started.'
                : 'Try adjusting your filters or search term.'}
            </p>
            {projects?.length === 0 && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                + Create Project
              </button>
            )}
          </div>
        )}

        {/* Project cards */}
        {filtered.length > 0 && (
          <div className="projects-grid">
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={p => navigate(`/projects/${p.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
