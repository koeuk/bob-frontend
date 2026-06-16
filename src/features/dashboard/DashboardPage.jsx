import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../../api/dashboard'
import { Link } from 'react-router-dom'
import { Loader2, FileText, MessageCircle, Heart, TrendingUp } from 'lucide-react'
import { assetUrl } from '../../lib/utils'

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/60">
      <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">{value ?? 0}</p>
      {sub && <p className="text-[11px] text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
      </div>
    )
  }

  const stats = data?.stats ?? {}
  const goal = data?.weekly_goal ?? { target: 20, progress: 0 }
  const activity = data?.recent_activity ?? []
  const goalPct = Math.min(100, Math.round((goal.progress / goal.target) * 100))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-400">Your activity at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard icon={FileText} label="Posts" value={stats.posts_total} sub={`${stats.posts_this_week ?? 0} this week`} />
        <StatCard icon={MessageCircle} label="Comments" value={stats.comments_received} sub={`${stats.comments_this_month ?? 0} this month`} />
        <StatCard icon={Heart} label="Reactions" value={stats.reactions_total} sub={`${stats.reactions_this_month ?? 0} this month`} />
        <StatCard icon={TrendingUp} label="This week" value={stats.posts_this_week} sub={`${stats.posts_last_week ?? 0} last week`} />
      </div>

      {/* Weekly goal */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Weekly goal</span>
          <span className="text-sm font-semibold text-primary">{goalPct}%</span>
        </div>
        <p className="text-xs text-zinc-400 mb-2.5">{goal.progress} / {goal.target} posts</p>
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${goalPct}%`, background: goalPct >= 100 ? '#22c55e' : 'oklch(0.46 0.15 143)' }}
          />
        </div>
        {goalPct >= 100 && (
          <p className="text-xs text-green-500 font-medium mt-1.5">Goal reached!</p>
        )}
      </div>

      {/* Recent comments */}
      {activity.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/60">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Recent comments</p>
          <div className="space-y-3">
            {activity.map((c) => (
              <Link key={c.id} to={`/posts/${c.post?.uuid}`} className="flex items-start gap-2.5 group">
                {c.user?.avatar ? (
                  <img src={assetUrl(c.user.avatar)} alt="" className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-xs font-bold shrink-0 mt-0.5">
                    {c.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.user?.name}</span>
                    <span className="text-zinc-400"> on </span>
                    <span className="text-zinc-600 dark:text-zinc-300 group-hover:text-primary transition-colors">
                      {c.post?.body?.slice(0, 40) || 'your post'}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{c.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
