import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom'
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

function isNavActive(to, pathname) {
  return pathname === to || (to === '/feed' && (pathname === '/' || pathname === '/feed'))
}

function SidebarNav({ items }) {
  const location = useLocation()
  const { dark } = useThemeStore()

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ to, label, icon: Icon }) => {
        const active = isNavActive(to, location.pathname)
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors duration-200 ${
              active
                ? dark
                  ? 'bg-[rgba(255,255,255,0.1)] text-gray-100'
                  : 'bg-[rgba(24,119,242,0.08)] text-gray-900'
                : 'text-gray-500 dark:text-gray-400 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${active ? 'text-[#1877F2]' : ''}`} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function MobileNav({ items }) {
  const location = useLocation()
  const { dark } = useThemeStore()

  return (
    <div
      className="flex overflow-x-auto"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = isNavActive(to, location.pathname)
        return (
          <Link
            key={to}
            to={to}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors duration-200"
            style={{
              borderColor: active ? '#1877F2' : 'transparent',
              color: active ? '#1877F2' : dark ? '#9ca3af' : '#6b7280',
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
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
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  useEffect(() => { init() }, [])

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  const navItems = isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') {
      const q = search.trim()
      navigate(q ? `/feed?q=${encodeURIComponent(q)}` : '/feed')
    }
    if (e.key === 'Escape') {
      setSearch('')
      navigate('/feed')
    }
  }

  const searchInputProps = (extraClass = '') => ({
    type: 'text',
    placeholder: 'Search Bob...',
    value: search,
    onChange: (e) => setSearch(e.target.value),
    onKeyDown: handleSearchKey,
    className: `w-full rounded-full pl-9 pr-4 py-[6px] text-[13px] outline-none transition-all duration-200 ${dark ? 'text-gray-200 placeholder:text-gray-500' : 'placeholder:text-gray-400'} ${extraClass}`,
    style: { background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: '1.5px solid transparent' },
    onFocus: (e) => {
      e.target.style.background = dark ? 'rgba(255,255,255,0.12)' : 'white'
      e.target.style.border = '1.5px solid rgba(24,119,242,0.4)'
      e.target.style.boxShadow = '0 0 0 3px rgba(24,119,242,0.12)'
    },
    onBlur: (e) => {
      e.target.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
      e.target.style.border = '1.5px solid transparent'
      e.target.style.boxShadow = 'none'
    },
  })

  const userAvatarEl = (size = 'h-9 w-9') => (
    <div
      className={`${size} rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm`}
      style={user?.avatar ? { border: '2px solid rgba(24,119,242,0.3)' } : {
        background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)',
        boxShadow: '0 2px 8px rgba(24,119,242,0.35)',
      }}
    >
      {user?.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        : user?.name?.[0]?.toUpperCase()
      }
    </div>
  )

  const userDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative cursor-pointer shrink-0 bg-transparent border-0 p-0 transition-all duration-200 hover:scale-105 hover:opacity-90 focus:outline-none">
        {userAvatarEl()}
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
          style={{ background: '#22c55e', borderColor: dark ? '#242526' : 'white' }}
        />
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
  )

  const panelStyle = {
    background: dark ? 'rgba(36,37,38,0.97)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.08)',
  }

  const divider = (my = 12) => (
    <div style={{ height: 1, margin: `${my}px 0`, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
  )

  return (
    <div
      className="min-h-screen"
      style={{ background: dark ? '#18191a' : 'linear-gradient(160deg,#f0f2ff 0%,#f5f6fb 45%,#edf0f8 100%)' }}
    >
      {/* ── Mobile header ── */}
      <header className="md:hidden sticky top-0 z-40 w-full p-3">
        <div className="rounded-2xl overflow-hidden" style={panelStyle}>
          <div className="relative px-4 h-[58px] flex items-center justify-between">
            <Link
              to="/feed"
              className="h-9 w-9 rounded-full flex items-center justify-center text-white font-black text-[17px] leading-none"
              style={{
                background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)',
                boxShadow: '0 3px 10px rgba(24,119,242,0.38)',
              }}
            >
              b
            </Link>
            <div className="flex items-center gap-1.5">
              {isAuthenticated ? (
                <>
                  <IconBtn icon={MessageCircle} title="Messages" />
                  <NotificationDropdown />
                  <IconBtn icon={dark ? Sun : Moon} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle} />
                  {userDropdown}
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
          <div style={{ height: 1, margin: '0 16px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <MobileNav items={navItems} />
          <div style={{ height: 1, margin: '0 16px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <div className="px-4 py-3 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input {...searchInputProps()} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Desktop: centered container (sidebar + content) ── */}
      <div className="max-w-[1160px] mx-auto flex">

        {/* ── Sidebar (desktop only) ── */}
        <aside className="hidden md:flex flex-col w-[248px] shrink-0 p-3 sticky top-0 h-screen z-40">
          <div className="flex flex-col h-full rounded-2xl p-4" style={panelStyle}>

            {/* Logo */}
            <Link
              to="/feed"
              className="h-9 w-9 rounded-full flex items-center justify-center text-white font-black text-[17px] leading-none transition-all duration-200 hover:scale-105 hover:opacity-90 mb-5 shrink-0"
              style={{
                background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)',
                boxShadow: '0 3px 10px rgba(24,119,242,0.38)',
              }}
            >
              b
            </Link>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input {...searchInputProps()} />
            </div>

            {divider(0)}

            {/* Nav items */}
            <div className="mt-3">
              <SidebarNav items={navItems} />
            </div>

            {/* Push icons to bottom */}
            <div className="flex-1" />

            {divider()}

            {/* Bottom icons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <IconBtn icon={MessageCircle} title="Messages" />
                <NotificationDropdown />
                <IconBtn icon={dark ? Sun : Moon} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle} />
                {userDropdown}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" className="rounded-full text-[13px] w-full" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="rounded-full text-[13px] bg-[#1877F2] hover:bg-[#166FE5] w-full" asChild>
                  <Link to="/register">Join</Link>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 px-4 py-5 min-w-0">
          <Outlet />
        </main>

      </div>

      <Toaster />
    </div>
  )
}
