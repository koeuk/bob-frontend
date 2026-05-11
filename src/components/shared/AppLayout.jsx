import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Home, FileText, LayoutDashboard, Flag, UserCircle, LogOut, Search, Bell, MessageCircle } from 'lucide-react'
import { Toaster } from '../ui/sonner'

const publicNavItems = [
  { to: '/feed', label: 'Feed', icon: Home },
]

const privateNavItems = [
  { to: '/my-posts', label: 'My Posts', icon: FileText },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports', label: 'Reports', icon: Flag },
]

function IconBtn({ icon: Icon, badge, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="cursor-pointer relative h-10 w-10 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] flex items-center justify-center transition-colors shrink-0"
    >
      <Icon className="h-5 w-5 text-gray-800" />
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1 leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  const navItems = isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-3 h-[56px] flex items-center gap-2">

          {/* Left: logo + search */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/feed" className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-extrabold text-lg leading-none shrink-0">
              b
            </Link>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Bob"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#F0F2F5] rounded-full pl-9 pr-4 py-2 text-[15px] w-56 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
            </div>
          </div>

          {/* Center: nav */}
          <nav className="flex items-center flex-1 justify-center">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center justify-center h-[56px] px-6 md:px-10 border-b-[3px] transition-colors ${
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

          {/* Right: action icons + user */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 shrink-0">
              <IconBtn icon={MessageCircle} title="Messages" badge={0} />
              <IconBtn icon={Bell} title="Notifications" badge={0} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity shrink-0">
                    {user?.name?.[0]?.toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex items-center gap-3 p-3 mb-1">
                    <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold shrink-0">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/account')}>
                    <UserCircle className="h-4 w-4 mr-2" /> My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => logoutMutation.mutate()}>
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
              <Button size="sm" className="bg-[#1877F2] hover:bg-[#166FE5]" asChild>
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
