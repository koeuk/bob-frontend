import { useEffect } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, Shield } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { assetUrl } from '../../lib/utils'
import { ADMIN_NAV, ROLE_LABELS } from './adminNav'

const BRAND = 'oklch(0.46 0.15 143)'

function NavItem({ to, label, icon: Icon, end, dark }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold select-none transition-colors duration-200"
      style={({ isActive }) => ({
        background: isActive
          ? (dark ? 'rgba(255,255,255,0.1)' : 'oklch(0.46 0.15 143 / 0.1)')
          : 'transparent',
        color: isActive ? BRAND : (dark ? '#9ca3af' : '#6b7280'),
      })}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user } = useAuthStore()
  const { dark, toggle, init } = useThemeStore()

  useEffect(() => { init() }, [init])

  const panelStyle = {
    background: dark ? 'rgba(36,37,38,0.97)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.08)',
  }

  const roleLabel = ROLE_LABELS[user?.role] ?? 'Staff'

  return (
    <div
      className="min-h-screen"
      style={{ background: dark ? '#18191a' : 'linear-gradient(160deg,#f0f2ff 0%,#f5f6fb 45%,#edf0f8 100%)' }}
    >
      {/* ── Mobile top bar ── */}
      <header className="md:hidden sticky top-0 z-40 w-full p-3">
        <div className="rounded-2xl overflow-hidden" style={panelStyle}>
          <div className="px-4 h-[58px] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: BRAND }}>
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-[15px] font-bold truncate" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>Admin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggle}
                title={dark ? 'Light mode' : 'Dark mode'}
                className="cursor-pointer h-9 w-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
              >
                {dark ? <Sun className="h-[18px] w-[18px] text-gray-300" /> : <Moon className="h-[18px] w-[18px] text-gray-700" />}
              </button>
              <Link
                to="/feed"
                title="Back to app"
                className="cursor-pointer h-9 w-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
              >
                <ArrowLeft className="h-[18px] w-[18px] text-gray-700 dark:text-gray-300" />
              </Link>
            </div>
          </div>
          <div style={{ height: 1, margin: '0 16px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          {/* Horizontal scroll nav */}
          <div className="flex overflow-x-auto px-2 py-2 gap-1" style={{ scrollbarWidth: 'none' }}>
            {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap select-none transition-all duration-200 active:scale-95"
                style={({ isActive }) => ({
                  background: isActive ? BRAND : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                  color: isActive ? '#fff' : (dark ? '#9ca3af' : '#6b7280'),
                })}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[1160px] mx-auto flex">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-[248px] shrink-0 p-3 sticky top-0 h-screen z-40">
          <div className="flex flex-col h-full rounded-2xl p-4" style={panelStyle}>
            {/* Brand */}
            <div className="flex items-center gap-2.5 mb-5 shrink-0">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: BRAND, boxShadow: '0 3px 10px oklch(0.46 0.15 143 / 0.38)' }}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>Bob Admin</p>
                <p className="text-[11px] font-semibold" style={{ color: BRAND }}>{roleLabel}</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5 overflow-y-auto">
              {ADMIN_NAV.map((item) => (
                <NavItem key={item.to} {...item} dark={dark} />
              ))}
            </nav>

            <div className="flex-1" />

            <div style={{ height: 1, margin: '12px 0', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />

            {/* Footer: user + actions */}
            <div className="flex items-center gap-2.5 mb-3">
              {user?.avatar ? (
                <img src={assetUrl(user.avatar)} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: BRAND }}>
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>{user?.name}</p>
                <p className="text-[11px] truncate" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                to="/feed"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-colors"
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: dark ? '#e4e6eb' : '#374151' }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to app
              </Link>
              <button
                onClick={toggle}
                title={dark ? 'Light mode' : 'Dark mode'}
                className="cursor-pointer h-9 w-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
              >
                {dark ? <Sun className="h-[18px] w-[18px] text-gray-300" /> : <Moon className="h-[18px] w-[18px] text-gray-700" />}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 px-4 py-5 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
