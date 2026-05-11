import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Home, FileText, LayoutDashboard, Flag, UserCircle, LogOut, Search, MessageCircle } from 'lucide-react'
import { Toaster } from '../ui/sonner'
import NotificationDropdown from './NotificationDropdown'

const publicNavItems  = [{ to: '/feed',      label: 'Feed',      icon: Home }]
const privateNavItems = [
  { to: '/my-posts',  label: 'My Posts',   icon: FileText },
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/reports',   label: 'Reports',    icon: Flag },
]

function IconBtn({ icon: Icon, badge, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="cursor-pointer relative h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105 shrink-0"
    >
      <Icon className="h-5 w-5 text-gray-700" />
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1 leading-none shadow-sm">
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
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #f0f2ff 0%, #f5f6fb 45%, #edf0f8 100%)' }}
    >
      {/* Glassmorphism header */}
      <header className="sticky top-0 z-40 border-b border-white/60" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-screen-xl mx-auto px-3 h-[56px] flex items-center gap-2">

          {/* Left: logo + search */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/feed"
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-extrabold text-lg leading-none shrink-0 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 8px rgba(24,119,242,0.35)' }}
            >
              b
            </Link>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Bob"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-100/80 rounded-full pl-9 pr-4 py-2 text-[14px] w-52 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#1877F2]/25 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Center: nav */}
          <nav className="flex items-center flex-1 justify-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `relative flex items-center justify-center h-[56px] px-6 md:px-9 transition-all duration-200 group ${
                    isActive ? 'text-[#1877F2]' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50' : 'group-hover:bg-gray-100'}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-12 rounded-t-full bg-[#1877F2]" style={{ animation: 'scaleIn 0.2s ease-out both' }} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: icons + user */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 shrink-0">
              <IconBtn icon={MessageCircle} title="Messages" badge={0} />
              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="cursor-pointer h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-all duration-200 hover:scale-105 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 8px rgba(24,119,242,0.30)' }}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-gray-100 p-1">
                  <div className="flex items-center gap-3 p-3 mb-1">
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)' }}
                    >
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[14px] truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => navigate('/account')}>
                    <UserCircle className="h-4 w-4 mr-2" /> My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive rounded-xl" onClick={() => logoutMutation.mutate()}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" className="rounded-full" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="rounded-full bg-[#1877F2] hover:bg-[#166FE5]" asChild>
                <Link to="/register">Join</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[860px] mx-auto px-4 py-5">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
