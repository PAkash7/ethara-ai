import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import useAuthStore from '../store/authStore'
import './ProjectDetailPage.css'

// ── Task Detail Modal ─────────────────────────────────────────
function TaskDetailModal({ task, project, onClose }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [editStatus, setEditStatus] = useState(task.status)
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description)
  const [editDue, setEditDue] = useState(task.due_date || '')
  const [editAssigned, setEditAssigned] = useState(task.assigned_to?.id || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = project.owner?.id === user?.id ||
    project.members?.some((m) => m.user.id === user?.id && m.role === 'admin')
  const isAssigned = task.assigned_to?.id === user?.id
  const canEdit = isAdmin || isAssigned

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = isAdmin
        ? { title: editTitle, description: editDesc, status: editStatus, priority: editPriority, due_date: editDue || null, assigned_to: editAssigned || null }
        : { status: editStatus }
      await api.patch(`/api/tasks/${task.id}/`, payload)
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id.toString()] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to update task.')
    } finally {
      setSaving(false)
    }
  }

  const deleteM = useMutation({
    mutationFn: () => api.delete(`/api/tasks/${task.id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id.toString()] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.detail || 'Not authorized to delete.'),
  })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 className="modal-title">Task Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        {isAdmin ? (
          <>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={editDue} onChange={(e) => setEditDue(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign To (User ID)</label>
                <input type="number" className="form-input" value={editAssigned} onChange={(e) => setEditAssigned(e.target.value)} placeholder="User ID" />
              </div>
            </div>
          </>
        ) : canEdit ? (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        ) : (
          <div className="task-readonly">
            <p><strong>Title:</strong> {task.title}</p>
            <p><strong>Status:</strong> <StatusBadge status={task.status} /></p>
            <p><strong>Priority:</strong> <PriorityBadge priority={task.priority} /></p>
            {task.due_date && <p><strong>Due:</strong> {task.due_date}</p>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={() => deleteM.mutate()} disabled={deleteM.isPending}>
              {deleteM.isPending ? 'Deleting…' : '🗑 Delete'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            {canEdit && (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── New Task Modal ────────────────────────────────────────────
function NewTaskModal({ project, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '',
  })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/tasks/', { ...data, project: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id.toString()] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err) => {
      const data = err.response?.data
      setError(typeof data === 'string' ? data : data?.assigned_to?.[0] || data?.title?.[0] || JSON.stringify(data))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    const payload = { ...form }
    if (!payload.due_date) delete payload.due_date
    if (!payload.assigned_to) delete payload.assigned_to
    else payload.assigned_to = parseInt(payload.assigned_to)
    mutation.mutate(payload)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
        <form id="new-task-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Task title" autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional description" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Assign To (User ID)</label>
              <input type="number" className="form-input" value={form.assigned_to} onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))} placeholder="User ID" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="create-task-btn" type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Member Modal ──────────────────────────────────────────
function AddMemberModal({ project, onClose }) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/api/projects/${project.id}/add_member/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id.toString()] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.detail || JSON.stringify(err.response?.data)),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!userId) { setError('User ID is required.'); return }
    mutation.mutate({ user_id: parseInt(userId), role })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">User ID</label>
            <input type="number" className="form-input" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter user ID" autoFocus required />
            <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              You can find the user ID in the Django admin panel.
            </small>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
const TAB_FILTERS = ['All', 'To Do', 'In Progress', 'Done']
const STATUS_MAP = { 'All': null, 'To Do': 'todo', 'In Progress': 'in_progress', 'Done': 'done' }

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('All')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/api/projects/${id}/`).then((r) => r.data),
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/api/tasks/?project=${id}`).then((r) => r.data),
  })

  const queryClient = useQueryClient()
  const removeMember = useMutation({
    mutationFn: (userId) => api.delete(`/api/projects/${id}/remove_member/${userId}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  })

  const isAdmin = project?.owner?.id === user?.id ||
    project?.members?.some((m) => m.user.id === user?.id && m.role === 'admin')

  const filteredTasks = (tasks || []).filter((t) => {
    const f = STATUS_MAP[activeTab]
    return f === null || t.status === f
  })

  if (projLoading) return (
    <div style={{ flexDirection: 'column' }} className="page-layout">
      <Navbar />
      <div className="loading-container"><div className="spinner" /><p>Loading project…</p></div>
    </div>
  )

  if (!project) return (
    <div style={{ flexDirection: 'column' }} className="page-layout">
      <Navbar />
      <div className="alert alert-danger" style={{ margin: 32 }}>Project not found.</div>
    </div>
  )

  return (
    <div style={{ flexDirection: 'column' }} className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                + Add Member
              </button>
              <button id="open-new-task-btn" className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>
                + New Task
              </button>
            </div>
          )}
        </div>

        <div className="detail-layout">
          {/* LEFT: Info + Members */}
          <aside className="project-sidebar">
            <div className="card">
              <h3 className="sidebar-section-title">Project Info</h3>
              <div className="info-row">
                <span className="info-label">Owner</span>
                <span>{project.owner?.username}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tasks</span>
                <span>{project.task_count}</span>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="sidebar-section-title">Members ({project.members?.length})</h3>
              <div className="member-list">
                {project.members?.map((m) => (
                  <div key={m.id} className="member-row">
                    <div className="member-avatar">
                      {m.user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{m.user.username}</span>
                      <span className={`role-badge ${m.role}`}>{m.role}</span>
                    </div>
                    {isAdmin && m.user.id !== project.owner?.id && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                        onClick={() => removeMember.mutate(m.user.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT: Tasks */}
          <section className="tasks-section">
            <div className="tabs">
              {TAB_FILTERS.map((tab) => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  <span className="tab-count">
                    {tab === 'All'
                      ? (tasks || []).length
                      : (tasks || []).filter((t) => t.status === STATUS_MAP[tab]).length
                    }
                  </span>
                </button>
              ))}
            </div>

            {tasksLoading && <div className="loading-container"><div className="spinner" /></div>}

            {!tasksLoading && filteredTasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No tasks {activeTab !== 'All' ? `with status "${activeTab}"` : 'yet'}</h3>
                {isAdmin && <p>Click "New Task" to create one.</p>}
              </div>
            )}

            <div className="tasks-grid">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={(t) => setSelectedTask(t)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {showNewTask && <NewTaskModal project={project} onClose={() => setShowNewTask(false)} />}
      {showAddMember && <AddMemberModal project={project} onClose={() => setShowAddMember(false)} />}
    </div>
  )
}
