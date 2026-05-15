import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import useAuthStore from '../store/authStore'
import './AdminPanel.css'

/* ── Stat Card ──────────────────────────────────────────────── */
function AdminStat({ icon, value, label, accent }) {
  return (
    <div className="admin-stat" style={{ '--accent': accent }}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-value">{value ?? '—'}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  )
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ title, badge }) {
  return (
    <div className="admin-section-header">
      <h2 className="admin-section-title">{title}</h2>
      {badge !== undefined && (
        <span className="admin-badge">{badge}</span>
      )}
    </div>
  )
}

/* ── Users Tab ──────────────────────────────────────────────── */
function UsersTab({ dashData }) {
  const { user: me } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users/').then(r => r.data),
  })

  const toggleStaff = useMutation({
    mutationFn: (userId) => api.post(`/api/admin/users/${userId}/toggle-staff/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  if (isLoading) return (
    <div className="loading-container"><div className="spinner" /><p>Loading users…</p></div>
  )

  return (
    <div>
      <SectionHeader title="All Users" badge={users?.length} />
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Projects Owned</th>
              <th>Memberships</th>
              <th>Tasks Assigned</th>
              <th>Joined</th>
              {me?.is_superuser && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-cell-avatar">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-cell-name">{u.username}</div>
                      <div className="user-cell-email">{u.email || '—'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="role-chips">
                    {u.is_superuser && <span className="role-chip superuser">Superuser</span>}
                    {u.is_staff && !u.is_superuser && <span className="role-chip staff">Staff</span>}
                    {!u.is_staff && <span className="role-chip user">Member</span>}
                    {!u.is_active && <span className="role-chip inactive">Inactive</span>}
                  </div>
                </td>
                <td><span className="count-cell">{u.projects_owned}</span></td>
                <td><span className="count-cell">{u.memberships}</span></td>
                <td><span className="count-cell">{u.tasks_assigned}</span></td>
                <td>
                  <span className="date-cell">
                    {new Date(u.date_joined).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                </td>
                {me?.is_superuser && (
                  <td>
                    {u.id !== me.id && !u.is_superuser && (
                      <button
                        className={`btn btn-sm ${u.is_staff ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleStaff.mutate(u.id)}
                        disabled={toggleStaff.isPending}
                        title={u.is_staff ? 'Remove staff status' : 'Promote to staff'}
                      >
                        {u.is_staff ? '↓ Demote' : '↑ Make Staff'}
                      </button>
                    )}
                    {(u.id === me.id || u.is_superuser) && (
                      <span className="protected-label">Protected</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Projects Tab ───────────────────────────────────────────── */
function ProjectsTab() {
  const navigate = useNavigate()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => api.get('/api/admin/projects/').then(r => r.data),
  })

  if (isLoading) return (
    <div className="loading-container"><div className="spinner" /><p>Loading projects…</p></div>
  )

  return (
    <div>
      <SectionHeader title="All Projects" badge={projects?.length} />
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Members</th>
              <th>Tasks</th>
              <th>Created</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map(p => (
              <tr key={p.id}>
                <td>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontStyle: 'italic' }}>
                      {p.name}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {p.description.slice(0, 50)}{p.description.length > 50 ? '…' : ''}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell-avatar sm">
                      {p.owner?.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13 }}>{p.owner?.username}</span>
                  </div>
                </td>
                <td><span className="count-cell">{p.members?.length ?? 0}</span></td>
                <td><span className="count-cell">{p.task_count ?? 0}</span></td>
                <td>
                  <span className="date-cell">
                    {new Date(p.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    Open →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Tasks Tab ──────────────────────────────────────────────── */
function TasksTab({ dashData }) {
  return (
    <div>
      <SectionHeader title="Recent Tasks (System-Wide)" badge={dashData?.total_tasks} />

      {/* Status breakdown */}
      <div className="status-breakdown">
        {[
          { key: 'todo',        label: 'To Do',       color: '#6b7280' },
          { key: 'in_progress', label: 'In Progress',  color: '#3b82f6' },
          { key: 'done',        label: 'Done',          color: '#10b981' },
        ].map(s => (
          <div key={s.key} className="breakdown-item">
            <div className="breakdown-bar-wrap">
              <div
                className="breakdown-bar"
                style={{
                  width: dashData?.total_tasks
                    ? `${(dashData.status_breakdown[s.key] / dashData.total_tasks) * 100}%`
                    : '0%',
                  background: s.color,
                }}
              />
            </div>
            <div className="breakdown-label">
              <span style={{ color: s.color, fontWeight: 700 }}>
                {dashData?.status_breakdown?.[s.key] ?? 0}
              </span>
              &nbsp;{s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="table-wrapper" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {dashData?.recent_tasks?.map(task => {
              const isOverdue = task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== 'done'
              return (
                <tr key={task.id} className={isOverdue ? 'overdue-row' : ''}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 600,
                    }}>
                      {task.title}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      #{task.project}
                    </span>
                  </td>
                  <td>
                    {task.assigned_to ? (
                      <div className="user-cell">
                        <div className="user-cell-avatar sm">
                          {task.assigned_to.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13 }}>{task.assigned_to.username}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td><StatusBadge status={task.status} /></td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td>
                    {task.due_date ? (
                      <span style={{ color: isOverdue ? 'var(--danger-text)' : 'var(--text-secondary)', fontSize: 13 }}>
                        {isOverdue && '⚠️ '}
                        {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────── */
const TABS = ['Overview', 'Users', 'Projects', 'Tasks']

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('Overview')
  const { user } = useAuthStore()

  const { data: dashData, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin/dashboard/').then(r => r.data),
  })

  return (
    <div className="page-layout" style={{ flexDirection: 'column' }}>
      <Navbar />
      <main className="main-content">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="admin-crown">👑</div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">
              <em>System-wide overview · Signed in as <strong>{user?.username}</strong>
              {user?.is_superuser && ' (Superuser)'}</em>
            </p>
          </div>
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            🔧 Django Admin →
          </a>
        </div>

        {isError && (
          <div className="alert alert-danger" style={{ marginBottom: 24 }}>
            ⚠️ Failed to load admin data. Make sure you have staff privileges.
          </div>
        )}

        {/* System-wide stat cards */}
        {dashData && (
          <div className="admin-stats-grid">
            <AdminStat icon="👥" value={dashData.total_users}    label="Total Users"     accent="linear-gradient(90deg,#7c3aed,#a855f7)" />
            <AdminStat icon="📁" value={dashData.total_projects} label="Total Projects"  accent="linear-gradient(90deg,#3b82f6,#60a5fa)" />
            <AdminStat icon="📋" value={dashData.total_tasks}    label="Total Tasks"     accent="linear-gradient(90deg,#10b981,#34d399)" />
            <AdminStat icon="⚡" value={dashData.status_breakdown?.in_progress} label="In Progress" accent="linear-gradient(90deg,#f59e0b,#fbbf24)" />
            <AdminStat icon="✅" value={dashData.status_breakdown?.done}        label="Completed"   accent="linear-gradient(90deg,#10b981,#6ee7b7)" />
            <AdminStat icon="🚨" value={dashData.overdue_total}  label="Overdue Tasks"   accent="linear-gradient(90deg,#dc2626,#ef4444)" />
          </div>
        )}

        {isLoading && (
          <div className="loading-container"><div className="spinner" /><p>Loading admin data…</p></div>
        )}

        {/* Tabs */}
        <div className="tabs admin-tabs" style={{ marginBottom: 24 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Overview'  && '📊 '}
              {tab === 'Users'     && '👥 '}
              {tab === 'Projects'  && '📁 '}
              {tab === 'Tasks'     && '📋 '}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && dashData && (
          <div className="overview-grid">
            {/* User activity table */}
            <div className="card">
              <h3 className="admin-section-title" style={{ marginBottom: 16 }}>User Activity</h3>
              <div className="user-activity-list">
                {dashData.user_stats?.map(item => (
                  <div key={item.user.id} className="user-activity-row">
                    <div className="user-cell-avatar">
                      {item.user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="user-activity-info">
                      <div className="user-activity-name">
                        {item.user.username}
                        {item.user.is_staff && (
                          <span className="role-chip staff" style={{ marginLeft: 8, fontSize: 10 }}>
                            Staff
                          </span>
                        )}
                      </div>
                      <div className="user-activity-meta">
                        {item.projects} project{item.projects !== 1 ? 's' : ''} ·{' '}
                        {item.assigned} task{item.assigned !== 1 ? 's' : ''}
                        {item.overdue > 0 && (
                          <span style={{ color: 'var(--danger-text)', marginLeft: 6 }}>
                            · ⚠️ {item.overdue} overdue
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="user-activity-bar-wrap">
                      <div
                        className="user-activity-bar"
                        style={{
                          width: dashData.total_tasks
                            ? `${Math.min((item.assigned / Math.max(...dashData.user_stats.map(u => u.assigned), 1)) * 100, 100)}%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {dashData.user_stats?.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                    No users yet.
                  </p>
                )}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="card">
              <h3 className="admin-section-title" style={{ marginBottom: 16 }}>Recent Projects</h3>
              <div className="recent-projects-list">
                {dashData.recent_projects?.map(p => (
                  <div key={p.id} className="recent-project-row">
                    <div className="recent-project-dot" />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontStyle: 'italic', fontSize: 14 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        by {p.owner?.username} · {p.task_count} task{p.task_count !== 1 ? 's' : ''} · {p.members?.length} member{p.members?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {dashData.recent_projects?.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                    No projects yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Users'    && <UsersTab dashData={dashData} />}
        {activeTab === 'Projects' && <ProjectsTab />}
        {activeTab === 'Tasks'    && <TasksTab dashData={dashData} />}

      </main>
    </div>
  )
}
