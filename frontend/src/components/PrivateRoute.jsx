import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
