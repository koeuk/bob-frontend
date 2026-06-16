import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { logout as logoutApi } from '../../api/auth'
import { getNotifications } from '../../api/notifications'
import { getUnreadCount } from '../../api/chat'
import { getUser } from '../../api/users'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Home, FileText, LayoutDashboard, Flag, Bell, UserCircle, LogOut, Search, MessageCircle, Sun, Moon, ArrowLeft } from 'lucide-react'
import { Toaster } from '../ui/sonner'
import NotificationDropdown from './NotificationDropdown'
import ChatPanel from './ChatPanel'
import useThemeStore from '../../store/themeStore'
import useChatStore from '../../store/chatStore'
import { assetUrl } from '../../lib/utils'

const publicNavItems = [
  { to: '/feed',      label: 'Feed',      icon: Home },
]
const privateNavItems = [
  { to: '/my-posts',       label: 'My Posts',      icon: FileText },
  { to: '/dashboard',      label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/notifications',  label: 'Notifications', icon: Bell },
  { to: '/reports',        label: 'Reports',       icon: Flag },
]

function isNavActive(to, pathname) {
  return pathname === to || (to === '/feed' && (pathname === '/' || pathname === '/feed'))
}

function SidebarNav({ items, badges = {} }) {
  const location = useLocation()
  const { dark } = useThemeStore()

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ to, label, icon: Icon }) => {
        const active = isNavActive(to, location.pathname)
        const badge = badges[to] ?? 0
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors duration-200 ${
              active
                ? dark
                  ? 'bg-[rgba(255,255,255,0.1)] text-gray-100'
                  : 'bg-primary/10 text-gray-900'
                : 'text-gray-500 dark:text-gray-400 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${active ? 'text-primary' : ''}`} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span
                className="h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                style={{ background: 'oklch(0.46 0.15 143)' }}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function BottomNav({ items, badges = {}, dark, panelStyle }) {
  const location = useLocation()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="rounded-2xl mx-auto max-w-md mb-2 flex items-stretch justify-around overflow-hidden" style={panelStyle}>
        {items.map(({ to, label, icon: Icon }) => {
          const active = isNavActive(to, location.pathname)
          const badge = badges[to] ?? 0
          return (
            <Link
              key={to}
              to={to}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 select-none transition-all duration-200 active:scale-95"
              style={{ color: active ? 'oklch(0.46 0.15 143)' : dark ? '#9ca3af' : '#6b7280' }}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: 'oklch(0.46 0.15 143)' }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
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

const RECENT_KEY = 'bob_recent_searches'
const loadRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] } }
const saveRecent = (q, prev) => {
  const next = [q, ...prev.filter(s => s !== q)].slice(0, 6)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

function SearchPopup({ anchorRef, search, dark, onSearch, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const [recent, setRecent] = useState(loadRecent)

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = (q, type = '') => {
    const trimmed = q.trim()
    if (trimmed) setRecent(prev => saveRecent(trimmed, prev))
    onSearch(trimmed, type)
    onClose()
  }

  const clearRecent = () => { setRecent([]); localStorage.removeItem(RECENT_KEY) }

  const bg = dark ? '#1e1f20' : 'white'
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const textColor = dark ? '#e4e6eb' : '#1c1e21'

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed', top: pos.top, left: pos.left, width: pos.width,
        zIndex: 9999, background: bg, borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${border}`,
        boxShadow: dark ? '0 12px 40px rgba(0,0,0,0.55)' : '0 8px 30px rgba(0,0,0,0.13)',
      }}
    >
      {/* Filter chips */}
      <div className="px-3 pt-3 pb-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>Filter by</p>
        <div className="flex flex-wrap gap-1.5">
          {[{ label: 'All', type: '' }, { label: 'Posts', type: 'posts' }, { label: 'People', type: 'people' }].map(({ label, type }) => (
            <button
              key={label}
              onMouseDown={(e) => { e.preventDefault(); go(search || '', type) }}
              className="cursor-pointer px-3 py-1 rounded-full text-[12px] font-semibold transition-all duration-150"
              style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: textColor }}
              onMouseEnter={e => { e.currentTarget.style.background = 'oklch(0.46 0.15 143 / 0.18)'; e.currentTarget.style.color = 'oklch(0.46 0.15 143)' }}
              onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = textColor }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent searches */}
      {recent.length > 0 && (
        <>
          <div style={{ height: 1, background: border }} />
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>Recent</p>
            <button onMouseDown={(e) => { e.preventDefault(); clearRecent() }} className="text-[11px] font-semibold text-primary cursor-pointer hover:underline">Clear</button>
          </div>
          {recent.map(q => (
            <button
              key={q}
              onMouseDown={(e) => { e.preventDefault(); go(q) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left cursor-pointer transition-colors duration-100"
              style={{ color: textColor, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: dark ? '#6b7280' : '#9ca3af' }} />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </>
      )}

      {/* Search for [query] when typing */}
      {search.trim() && (
        <>
          <div style={{ height: 1, background: border }} />
          <button
            onMouseDown={(e) => { e.preventDefault(); go(search.trim()) }}
            className="w-full flex items-center gap-2.5 px-3 py-3 text-[13px] text-left cursor-pointer transition-colors duration-100"
            style={{ color: 'oklch(0.46 0.15 143)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'oklch(0.46 0.15 143 / 0.1)' : 'oklch(0.46 0.15 143 / 0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Search className="h-4 w-4 shrink-0" />
            Search for "<strong>{search.trim()}</strong>"
          </button>
        </>
      )}
    </div>,
    document.body
  )
}

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const { dark, toggle, init } = useThemeStore()
  const { openPanel: openChat } = useChatStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef(null)

  // On a user profile, the mobile header becomes a back + title app bar
  const profileUuid = location.pathname.match(/^\/users\/([^/]+)/)?.[1] ?? null
  const { data: profileData } = useQuery({
    queryKey: ['user-profile', profileUuid],
    queryFn: () => getUser(profileUuid).then((r) => r.data),
    enabled: !!profileUuid,
  })
  const profileName = profileData?.user?.name

  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: () => getUnreadCount().then(r => r.data),
    refetchInterval: 10000,
    enabled: isAuthenticated,
  })
  const unreadCount = unreadData?.count ?? 0

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then(r => r.data),
    refetchInterval: 30000,
    enabled: isAuthenticated,
  })
  const unreadNotifCount = notifData?.unread_count ?? 0

  const navBadges = { '/notifications': unreadNotifCount }

  useEffect(() => { init() }, [])

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => { logout(); navigate('/login', { replace: true }) },
  })

  const navItems = isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems

  const handleSearchNavigate = (q, type = '') => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    const qs = params.toString()
    navigate(q || type ? `/feed${qs ? `?${qs}` : ''}` : '/feed')
    setSearch(q)
    setSearchOpen(false)
  }

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') handleSearchNavigate(search.trim())
    if (e.key === 'Escape') { setSearch(''); setSearchOpen(false); navigate('/feed') }
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
      e.target.style.border = '1.5px solid oklch(0.46 0.15 143 / 0.4)'
      e.target.style.boxShadow = '0 0 0 3px oklch(0.46 0.15 143 / 0.12)'
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
      style={user?.avatar ? { border: '2px solid oklch(0.46 0.15 143 / 0.3)' } : {
        background: 'oklch(0.46 0.15 143)',
        boxShadow: '0 2px 8px oklch(0.46 0.15 143 / 0.35)',
      }}
    >
      {user?.avatar
        ? <img src={assetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
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
            style={user?.avatar ? {} : { background: 'oklch(0.46 0.15 143)' }}
          >
            {user?.avatar
              ? <img src={assetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
              : user?.name?.[0]?.toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[14px] truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => navigate(`/users/${user?.uuid}`)}>
          <UserCircle className="h-4 w-4 mr-2" /> View Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => navigate('/my-posts')}>
          <FileText className="h-4 w-4 mr-2" /> My Posts
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => navigate('/dashboard')}>
          <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => navigate('/notifications')}>
          <Bell className="h-4 w-4 mr-2" /> Notifications
        </DropdownMenuItem>
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
          {profileUuid ? (
          /* Profile screen: back button + title */
          <div className="px-2 h-[58px] flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              title="Back"
              className="cursor-pointer h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <span className="text-[16px] font-bold truncate" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>
              {profileName ?? 'Profile'}
            </span>
          </div>
          ) : (
          <>
          <div className="relative px-4 h-[58px] flex items-center justify-between gap-2">
            {profileUuid ? (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 min-w-0 cursor-pointer bg-transparent border-0 p-0 -ml-1 transition-opacity duration-200 hover:opacity-80"
              >
                <ArrowLeft className="h-6 w-6 shrink-0 text-gray-700 dark:text-gray-200" />
                <span className="font-bold text-[16px] leading-tight truncate text-gray-900 dark:text-gray-100">
                  {profileName ?? 'Profile'}
                </span>
              </button>
            ) : (
              <Link
                to="/feed"
                className="h-9 w-9 rounded-full flex items-center justify-center text-white font-black text-[17px] leading-none shrink-0"
                style={{
                  background: 'oklch(0.46 0.15 143)',
                  boxShadow: '0 3px 10px oklch(0.46 0.15 143 / 0.38)',
                }}
              >
                b
              </Link>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <IconBtn icon={MessageCircle} title="Messages" onClick={openChat} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center pointer-events-none" style={{ background: 'oklch(0.46 0.15 143)' }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <NotificationDropdown />
                  <IconBtn icon={dark ? Sun : Moon} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle} />
                  {userDropdown}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="rounded-full text-[13px]" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button size="sm" className="rounded-full text-[13px] bg-primary hover:bg-primary/90" asChild>
                    <Link to="/register">Join</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          {!profileUuid && (
            <>
              <div style={{ height: 1, margin: '0 16px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
              <div className="px-4 py-3 flex items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input {...searchInputProps()} />
                </div>
              </div>
            </>
          )}
          </>
          )}
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
                background: 'oklch(0.46 0.15 143)',
                boxShadow: '0 3px 10px oklch(0.46 0.15 143 / 0.38)',
              }}
            >
              b
            </Link>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                {...searchInputProps()}
                onFocus={(e) => { searchInputProps().onFocus(e); setSearchOpen(true) }}
              />
              {searchOpen && (
                <SearchPopup
                  anchorRef={searchInputRef}
                  search={search}
                  dark={dark}
                  onSearch={handleSearchNavigate}
                  onClose={() => setSearchOpen(false)}
                />
              )}
            </div>

            {divider(0)}

            {/* Nav items */}
            <div className="mt-3">
              <SidebarNav items={navItems} badges={navBadges} />
            </div>

            {/* Push icons to bottom */}
            <div className="flex-1" />

            {divider()}

            {/* Bottom icons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <IconBtn icon={MessageCircle} title="Messages" onClick={openChat} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center pointer-events-none" style={{ background: 'oklch(0.46 0.15 143)' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <IconBtn icon={dark ? Sun : Moon} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle} />
                <IconBtn icon={LogOut} title="Sign out" onClick={() => logoutMutation.mutate()} />
                <Link
                  to={`/users/${user?.uuid}`}
                  className="relative shrink-0 transition-all duration-200 hover:scale-105 hover:opacity-90"
                >
                  {userAvatarEl()}
                  <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                    style={{ background: '#22c55e', borderColor: dark ? '#242526' : 'white' }}
                  />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" className="rounded-full text-[13px] w-full" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="rounded-full text-[13px] bg-primary hover:bg-primary/90 w-full" asChild>
                  <Link to="/register">Join</Link>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 px-4 py-5 min-w-0 pb-24 md:pb-5">
          <Outlet />
        </main>

      </div>

      {/* ── Mobile bottom nav ── */}
      <BottomNav items={navItems} badges={navBadges} dark={dark} panelStyle={panelStyle} />

      <ChatPanel />
      <Toaster />
    </div>
  )
}
