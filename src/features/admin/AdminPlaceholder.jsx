import { Construction } from 'lucide-react'
import useThemeStore from '../../store/themeStore'

// Temporary stand-in for admin sections that aren't built yet, so the
// sidebar/nav links resolve instead of 404-ing while the shell is in place.
export default function AdminPlaceholder({ title }) {
  const { dark } = useThemeStore()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      <div
        className="rounded-2xl p-12 text-center flex flex-col items-center gap-3"
        style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'oklch(0.46 0.15 143 / 0.12)' }}>
          <Construction className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-200">{title} — coming soon</p>
          <p className="text-[14px] text-gray-400 mt-1">This section will be built in a later phase.</p>
        </div>
      </div>
    </div>
  )
}
