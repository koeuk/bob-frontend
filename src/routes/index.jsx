import { createBrowserRouter } from 'react-router-dom'
import { PrivateRoute, GuestRoute, AdminRoute } from './guards'

// Layouts
import AppLayout from '../components/shared/AppLayout'
import AdminLayout from '../components/shared/AdminLayout'
import AuthLayout from '../components/shared/AuthLayout'

// Auth
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'

// User
import FeedPage from '../features/feed/FeedPage'
import PostDetailPage from '../features/posts/PostDetailPage'
import MyPostsPage from '../features/posts/MyPostsPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import MyReportsPage from '../features/reports/MyReportsPage'
import SettingsPage from '../features/settings/SettingsPage'

// Admin
import AdminDashboardPage from '../features/admin/dashboard/AdminDashboardPage'
import AdminUsersPage from '../features/admin/users/AdminUsersPage'
import AdminPostsPage from '../features/admin/posts/AdminPostsPage'
import AdminCommentsPage from '../features/admin/comments/AdminCommentsPage'
import AdminReportsPage from '../features/admin/reports/AdminReportsPage'
import AdminBansPage from '../features/admin/bans/AdminBansPage'
import AdminPagesPage from '../features/admin/pages/AdminPagesPage'
import AdminSettingsPage from '../features/admin/settings/AdminSettingsPage'
import AdminActivityLogsPage from '../features/admin/activity-logs/AdminActivityLogsPage'

const router = createBrowserRouter([
  // Guest routes
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // User routes
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <FeedPage /> },
          { path: '/feed', element: <FeedPage /> },
          { path: '/posts/:uuid', element: <PostDetailPage /> },
          { path: '/my-posts', element: <MyPostsPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/reports', element: <MyReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/posts', element: <AdminPostsPage /> },
          { path: '/admin/comments', element: <AdminCommentsPage /> },
          { path: '/admin/reports', element: <AdminReportsPage /> },
          { path: '/admin/bans', element: <AdminBansPage /> },
          { path: '/admin/pages', element: <AdminPagesPage /> },
          { path: '/admin/settings', element: <AdminSettingsPage /> },
          { path: '/admin/activity-logs', element: <AdminActivityLogsPage /> },
        ],
      },
    ],
  },
])

export default router
