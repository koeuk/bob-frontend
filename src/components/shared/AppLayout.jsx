import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Home, FileText, LayoutDashboard, Flag, UserCircle, LogOut, ChevronDown } from 'lucide-react'
import { Toaster } from '../ui/sonner'

const publicNavItems = [
  { to: '/feed', label: 'Feed', icon: Home },
]

const privateNavItems = [
  { to: '/my-posts', label: 'My Posts', icon: FileText },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports', label: 'Reports', icon: Flag },
]

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  const navItems = isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-[56px] flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/feed" className="text-2xl font-extrabold text-[#1877F2] shrink-0 leading-none">
            bob
          </Link>

          {/* Center nav */}
          <nav className="flex items-center">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center justify-center h-[56px] px-8 border-b-[3px] transition-colors ${
                    isActive
                      ? 'border-[#1877F2] text-[#1877F2]'
                      : 'border-transparent text-gray-500 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="h-6 w-6" />
              </NavLink>
            ))}
          </nav>

          {/* Right: user actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 bg-[#E4E6EB] hover:bg-[#D8DADF] rounded-full pl-1 pr-2 py-1 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[80px] truncate hidden sm:block">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown className="h-4 w-4 text-gray-600 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="flex items-center gap-3 p-2 mb-1">
                    <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
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
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Join</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[680px] mx-auto px-4 py-4">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
