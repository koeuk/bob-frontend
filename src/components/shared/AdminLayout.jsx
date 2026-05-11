import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { LayoutDashboard, Users, FileText, MessageCircle, Flag, ShieldBan, BookOpen, Settings, Activity, LogOut, ChevronRight } from 'lucide-react'
import { Toaster } from '../ui/sonner'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/posts', label: 'Posts', icon: FileText },
  { to: '/admin/comments', label: 'Comments', icon: MessageCircle },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/bans', label: 'Bans', icon: ShieldBan },
  { to: '/admin/pages', label: 'Pages', icon: BookOpen },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/activity-logs', label: 'Activity Logs', icon: Activity },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-56 shrink-0 border-r bg-background flex flex-col">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-bold text-lg">Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <span className="truncate flex-1">{user?.name}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive gap-2" onClick={() => logoutMutation.mutate()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
