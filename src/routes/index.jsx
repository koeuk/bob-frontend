import { createBrowserRouter } from 'react-router-dom'
import { PrivateRoute, GuestRoute, AdminRoute } from './guards'

// Layouts
import AppLayout from '../components/shared/AppLayout'
import AuthLayout from '../components/shared/AuthLayout'
import AdminLayout from '../features/admin/AdminLayout'

// Admin
import AdminDashboardPage from '../features/admin/AdminDashboardPage'
import AdminReportsPage from '../features/admin/AdminReportsPage'
import AdminUsersPage from '../features/admin/AdminUsersPage'
import AdminPlaceholder from '../features/admin/AdminPlaceholder'


// Auth
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import GoogleCallbackPage from '../features/auth/GoogleCallbackPage'

// User
import FeedPage from '../features/feed/FeedPage'
import PostDetailPage from '../features/posts/PostDetailPage'
import MyPostsPage from '../features/posts/MyPostsPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import MyReportsPage from '../features/reports/MyReportsPage'
import NotificationsPage from '../features/notifications/NotificationsPage'
import AccountPage from '../features/account/AccountPage'
import UserProfilePage from '../features/users/UserProfilePage'

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
          { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
        ],
      },
    ],
  },

  // Public routes (viewable without login)
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <FeedPage /> },
      { path: '/feed', element: <FeedPage /> },
      { path: '/posts/:uuid', element: <PostDetailPage /> },
      { path: '/users/:uuid', element: <UserProfilePage /> },
    ],
  },

  // Private routes (require login)
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/my-posts', element: <MyPostsPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/reports', element: <MyReportsPage /> },
          { path: '/account', element: <AccountPage /> },
        ],
      },
    ],
  },

  // Admin routes (require moderator/admin/super_admin role)
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/posts', element: <AdminPlaceholder title="Posts" /> },
          { path: '/admin/comments', element: <AdminPlaceholder title="Comments" /> },
          { path: '/admin/reports', element: <AdminReportsPage /> },
          { path: '/admin/bans', element: <AdminPlaceholder title="Bans" /> },
          { path: '/admin/likes', element: <AdminPlaceholder title="Likes" /> },
          { path: '/admin/pages', element: <AdminPlaceholder title="Pages" /> },
          { path: '/admin/settings', element: <AdminPlaceholder title="Settings" /> },
          { path: '/admin/activity', element: <AdminPlaceholder title="Activity Logs" /> },
        ],
      },
    ],
  },
])

export default router
