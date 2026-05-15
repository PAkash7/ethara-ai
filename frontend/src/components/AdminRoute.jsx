import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * AdminRoute — blocks non-staff users from accessing admin pages.
 * If not authenticated  → /login
 * If authenticated but not staff → /access-denied
 * If staff → render children
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.is_staff) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}
