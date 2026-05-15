import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import './TaskCard.css'

function getInitials(username) {
  return username ? username.slice(0, 2).toUpperCase() : '?'
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false
  return new Date(dueDate) < new Date()
}

export default function TaskCard({ task, onClick }) {
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <div
      className={`task-card ${overdue ? 'overdue' : ''}`}
      onClick={() => onClick && onClick(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick(task)}
    >
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <StatusBadge status={task.status} />

        <div className="task-meta">
          {task.due_date && (
            <span className={`due-date ${overdue ? 'overdue-text' : ''}`}>
              📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              })}
            </span>
          )}
          {task.assigned_to && (
            <div className="assignee-avatar" title={task.assigned_to.username}>
              {getInitials(task.assigned_to.username)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
