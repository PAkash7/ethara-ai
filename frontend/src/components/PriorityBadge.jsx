const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
}

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

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
      {config.label}
    </span>
  )
}
