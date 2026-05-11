import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Home, FileText, LayoutDashboard, Flag, UserCircle, LogOut, Search, MessageCircle, Sun, Moon } from 'lucide-react'
import { Toaster } from '../ui/sonner'
import NotificationDropdown from './NotificationDropdown'
import useThemeStore from '../../store/themeStore'

const publicNavItems = [
  { to: '/feed',      label: 'Feed',      icon: Home },
]
const privateNavItems = [
  { to: '/my-posts',  label: 'My Posts',  icon: FileText },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports',   label: 'Reports',   icon: Flag },
]

function SlidingPillNav({ items }) {
  const location = useLocation()
  const containerRef = useRef(null)
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const activeEl = container.querySelector('[data-active="true"]')
    if (!activeEl) return
    const cRect = container.getBoundingClientRect()
    const eRect = activeEl.getBoundingClientRect()
    setPill({ left: eRect.left - cRect.left, width: eRect.width, ready: true })
  }, [location.pathname])

  const isActive = (to) =>
    location.pathname === to ||
    (to === '/feed' && (location.pathname === '/' || location.pathname === '/feed'))

  return (
    <div
      ref={containerRef}
      className="relative flex items-center p-1 rounded-full"
      style={{ background: 'rgba(0,0,0,0.06)' }}
    >
      {pill.ready && (
        <div
          className="absolute top-1 bottom-1 left-0 rounded-full"
          style={{
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
            background: 'white',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1), width 0.3s cubic-bezier(0.34,1.2,0.64,1)',
            willChange: 'transform',
          }}
        />
      )}
      {items.map(({ to, label, icon: Icon }) => {
        const active = isActive(to)
        return (
          <Link
            key={to}
            to={to}
            data-active={active ? 'true' : 'false'}
            className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 ${
              active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className={`h-4 w-4 transition-colors duration-200 ${active ? 'text-[#1877F2]' : ''}`} />
            <span>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}

function IconBtn({ icon: Icon, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="cursor-pointer h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shrink-0"
      style={{ background: 'rgba(0,0,0,0.05)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
    >
      <Icon className="h-4.5 w-4.5 text-gray-700 dark:text-gray-300" style={{ height: 18, width: 18 }} />
    </button>
  )
}

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const { dark, toggle, init } = useThemeStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  useEffect(() => { init() }, [])

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  const navItems = isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems

  return (
    <div
      className="min-h-screen"
      style={{ background: dark ? '#18191a' : 'linear-gradient(160deg,#f0f2ff 0%,#f5f6fb 45%,#edf0f8 100%)' }}
    >

      {/* ── Header card: navbar row + search row ── */}
      <header className="sticky top-0 z-40 w-full p-6">
        <div
          className="max-w-[860px] mx-auto rounded-2xl overflow-hidden"
          style={{
            background: dark ? 'rgba(36,37,38,0.97)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* Row 1: logo + pills + icons */}
          <div className="relative px-4 h-[58px] flex items-center justify-center">
            <Link
              to="/feed"
              className="absolute left-4 h-9 w-9 rounded-full flex items-center justify-center text-white font-black text-[17px] leading-none transition-all duration-200 hover:scale-105 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)',
                boxShadow: '0 3px 10px rgba(24,119,242,0.38)',
              }}
            >
              b
            </Link>

            <SlidingPillNav items={navItems} />

            <div className="absolute right-4 flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <IconBtn icon={MessageCircle} title="Messages" />
                  <NotificationDropdown />
                  <IconBtn icon={dark ? Sun : Moon} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="cursor-pointer h-9 w-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm transition-all duration-200 hover:scale-105 hover:opacity-90 shrink-0"
                        style={user?.avatar ? { border: '2px solid rgba(24,119,242,0.3)' } : {
                          background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)',
                          boxShadow: '0 2px 8px rgba(24,119,242,0.35)',
                        }}
                      >
                        {user?.avatar
                          ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          : user?.name?.[0]?.toUpperCase()
                        }
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-gray-100 p-1">
                      <div className="flex items-center gap-3 p-3 mb-1">
                        <div
                          className="h-11 w-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0"
                          style={user?.avatar ? {} : { background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)' }}
                        >
                          {user?.avatar
                            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            : user?.name?.[0]?.toUpperCase()
                          }
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
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="rounded-full text-[13px]" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button size="sm" className="rounded-full text-[13px] bg-[#1877F2] hover:bg-[#166FE5]" asChild>
                    <Link to="/register">Join</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px mx-4 ${dark ? 'bg-white/10' : 'bg-gray-100'}`} />

          {/* Row 2: search */}
          <div className="px-4 py-5 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Bob..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full rounded-full pl-10 pr-4 py-[6px] text-[13px] outline-none transition-all duration-200 ${dark ? 'text-gray-200 placeholder:text-gray-500' : 'placeholder:text-gray-400'}`}
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: '1.5px solid transparent' }}
                onFocus={e => {
                  e.target.style.background = dark ? 'rgba(255,255,255,0.12)' : 'white'
                  e.target.style.border = '1.5px solid rgba(24,119,242,0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(24,119,242,0.12)'
                }}
                onBlur={e => {
                  e.target.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                  e.target.style.border = '1.5px solid transparent'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[860px] mx-auto px-4 py-5">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
