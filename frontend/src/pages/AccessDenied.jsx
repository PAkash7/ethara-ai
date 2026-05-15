import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import './AccessDenied.css'

export default function AccessDenied() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="denied-page">
      {/* Background orbs */}
      <div className="denied-orbs" aria-hidden="true">
        <div className="denied-orb denied-orb-1" />
        <div className="denied-orb denied-orb-2" />
      </div>

      <div className="denied-card">
        <div className="denied-shield">
          <div className="shield-icon">🛡️</div>
          <div className="shield-ring ring-1" />
          <div className="shield-ring ring-2" />
          <div className="shield-ring ring-3" />
        </div>

        <div className="denied-code">403</div>
        <h1 className="denied-title">Access Denied</h1>
        <p className="denied-subtitle">
          <em>
            You do not have the necessary privileges to view this page.
            This area is restricted to administrators only.
          </em>
        </p>

        <div className="denied-divider" />

        <div className="denied-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            ← Return to Dashboard
          </button>
          {!isAuthenticated && (
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          )}
        </div>

        <p className="denied-help">
          If you believe this is a mistake, please contact your system administrator.
        </p>
      </div>
    </div>
  )
}
