import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export const ADMIN_ROLES = ['moderator', 'admin', 'super_admin']

export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export function AdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!ADMIN_ROLES.includes(user?.role)) return <Navigate to="/feed" replace />
  return <Outlet />
}

export function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/feed" replace /> : <Outlet />
}
