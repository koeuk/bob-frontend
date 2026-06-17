import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { ADMIN_NAV, ROLE_LABELS } from './adminNav'

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const { dark } = useThemeStore()

  const cardStyle = {
    background: dark ? '#242526' : 'white',
    boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
  }

  // Everything except the dashboard itself is a section to manage
  const sections = ADMIN_NAV.filter((n) => !n.end)
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin</h1>
        <p className="text-sm text-gray-400">
          Welcome back, {firstName} · {ROLE_LABELS[user?.role] ?? 'Staff'}
        </p>
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {sections.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={cardStyle}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'oklch(0.46 0.15 143 / 0.12)' }}
            >
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{label}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Manage {label.toLowerCase()}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
