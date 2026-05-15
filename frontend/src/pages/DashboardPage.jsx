import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import useAuthStore from '../store/authStore'
import './DashboardPage.css'

function StatCard({ value, label, accent, icon }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard/').then((r) => r.data),
  })

  return (
    <div className="page-layout" style={{ flexDirection: 'column' }}>
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title etharai-title">
              Welcome to{' '}
              <span className="etharai-brand">Ethara.AI</span>
            </h1>
            <p className="page-subtitle etharai-subtitle">
              <span className="etharai-byline">Dashboard by Akash Pandey</span>
              <span className="etharai-sep">·</span>
              <em>Good to see you, <strong>{user?.username}</strong> 👋</em>
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading your dashboard…</p>
          </div>
        )}

        {isError && (
          <div className="alert alert-danger">
            ⚠️ Failed to load dashboard: {error?.message}
          </div>
        )}

        {data && (
          <>
            {/* Stat Cards */}
            <div className="stats-grid">
              <StatCard
                value={data.total_tasks}
                label="Total Tasks"
                accent="linear-gradient(90deg, #6366f1, #818cf8)"
                icon="📋"
              />
              <StatCard
                value={data.todo}
                label="To Do"
                accent="linear-gradient(90deg, #6b7280, #9ca3af)"
                icon="🔵"
              />
              <StatCard
                value={data.in_progress}
                label="In Progress"
                accent="linear-gradient(90deg, #3b82f6, #60a5fa)"
                icon="⚡"
              />
              <StatCard
                value={data.done}
                label="Completed"
                accent="linear-gradient(90deg, #10b981, #34d399)"
                icon="✅"
              />
              <StatCard
                value={data.my_tasks}
                label="Assigned to Me"
                accent="linear-gradient(90deg, #8b5cf6, #a78bfa)"
                icon="👤"
              />
              <StatCard
                value={data.total_projects}
                label="My Projects"
                accent="linear-gradient(90deg, #f59e0b, #fbbf24)"
                icon="📁"
              />
            </div>

            {/* Overdue Alert */}
            {data.overdue > 0 && (
              <div className="alert alert-danger overdue-alert">
                🚨 <strong>{data.overdue} task{data.overdue > 1 ? 's are' : ' is'} overdue!</strong>
                &nbsp;Please review your projects.
              </div>
            )}

            {/* Recent Tasks */}
            <section>
              <div className="section-header">
                <h2 className="section-title">Recent Tasks</h2>
                <Link to="/projects" className="btn btn-secondary btn-sm">
                  View All Projects →
                </Link>
              </div>

              {data.recent_tasks?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No tasks yet</h3>
                  <p>Create a project and add some tasks to get started.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Assigned To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_tasks.map((task) => (
                        <tr key={task.id}>
                          <td>
                            <span style={{ fontWeight: 600 }}>{task.title}</span>
                            {task.description && (
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}
                              </p>
                            )}
                          </td>
                          <td><StatusBadge status={task.status} /></td>
                          <td><PriorityBadge priority={task.priority} /></td>
                          <td>
                            {task.due_date ? (
                              <span style={{
                                color: new Date(task.due_date) < new Date() && task.status !== 'done'
                                  ? '#ef4444' : 'var(--text-secondary)',
                                fontSize: '13px',
                              }}>
                                {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            {task.assigned_to ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '26px', height: '26px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', fontWeight: '700', color: '#fff',
                                }}>
                                  {task.assigned_to.username.slice(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '13px' }}>{task.assigned_to.username}</span>
                              </div>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Unassigned</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
