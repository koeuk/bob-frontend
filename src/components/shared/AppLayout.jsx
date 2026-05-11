import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Home, FileText, LayoutDashboard, Flag, UserCircle, LogOut, User } from 'lucide-react'
import { Toaster } from '../ui/sonner'

const navItems = [
  { to: '/feed', label: 'Feed', icon: Home },
  { to: '/my-posts', label: 'My Posts', icon: FileText },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports', label: 'Reports', icon: Flag },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-24 truncate">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/account')}>
                <UserCircle className="h-4 w-4 mr-2" /> My Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => logoutMutation.mutate()}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
