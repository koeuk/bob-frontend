import { createBrowserRouter } from 'react-router-dom'
import { PrivateRoute, GuestRoute } from './guards'

// Layouts
import AppLayout from '../components/shared/AppLayout'
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
          { path: '/reports', element: <MyReportsPage /> },
          { path: '/account', element: <AccountPage /> },
        ],
      },
    ],
  },
])

export default router
