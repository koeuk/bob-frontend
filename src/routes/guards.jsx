import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ADMIN_ROLES = ['moderator', 'admin', 'super_admin']

export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export function GuestRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Outlet />
  return <Navigate to={ADMIN_ROLES.includes(user?.role) ? '/admin/dashboard' : '/feed'} replace />
}

export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!ADMIN_ROLES.includes(user?.role)) return <Navigate to="/feed" replace />
  return <Outlet />
}
