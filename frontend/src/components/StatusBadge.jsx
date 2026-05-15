const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  done:        { label: 'Done',        color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}40`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: config.color,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {config.label}
    </span>
  )
}
