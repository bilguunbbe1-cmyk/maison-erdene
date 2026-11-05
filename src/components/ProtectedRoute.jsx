import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PageLoader } from './ui.jsx'

// Wraps routes that need a signed-in user, or an admin with requireAdmin.
export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Wait for the auth check, or a refresh would bounce signed-in users to /login.
  if (loading) return <PageLoader />

  if (!user) {
    // Remember the destination so login can send the user back there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
