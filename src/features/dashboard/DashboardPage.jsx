import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../../api/dashboard'
import { Link } from 'react-router-dom'
import { Loader2, FileText, MessageCircle, Heart, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, iconColor, trend }) {
  const trendEl = trend != null
    ? trend > 0
      ? <span className="flex items-center gap-0.5 text-green-500 text-[11px] font-semibold"><ArrowUpRight className="h-3 w-3" />+{trend}%</span>
      : trend < 0
        ? <span className="flex items-center gap-0.5 text-red-400 text-[11px] font-semibold"><ArrowDownRight className="h-3 w-3" />{trend}%</span>
        : <span className="flex items-center gap-0.5 text-gray-400 text-[11px]"><Minus className="h-3 w-3" />0%</span>
    : null

  return (
    <div
      className="scale-in bg-white rounded-2xl p-4 flex items-center gap-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${iconColor}15` }}>
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-[26px] font-bold text-gray-900 leading-tight">{value ?? 0}</p>
          {trendEl}
        </div>
        <p className="text-[13px] text-gray-400 leading-tight">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function EngagementChart({ series }) {
  const maxPosts = Math.max(...series.map((p) => p.posts), 1)
  const maxReactions = Math.max(...series.map((p) => p.reactions), 1)
  const max = Math.max(maxPosts, maxReactions)

  return (
    <div className="flex items-end gap-1.5 h-28 pt-2">
      {series.map((point, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: 80 }}>
            <div
              className="flex-1 rounded-t-sm transition-all duration-500"
              style={{ height: `${Math.max(3, (point.posts / max) * 100)}%`, background: '#1877F2', opacity: 0.85 }}
              title={`${point.posts} posts`}
            />
            <div
              className="flex-1 rounded-t-sm transition-all duration-500"
              style={{ height: `${Math.max(3, (point.reactions / max) * 100)}%`, background: '#F33E58', opacity: 0.75 }}
              title={`${point.reactions} reactions`}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{point.label}</span>
        </div>
      ))}
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
      </div>
    )
  }

  const stats = data?.stats ?? {}
  const goal = data?.weekly_goal ?? { target: 20, progress: 0 }
  const series = data?.engagement_series ?? []
  const activity = data?.recent_activity ?? []

  const goalPct = Math.min(100, Math.round((goal.progress / goal.target) * 100))

  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        className="scale-in bg-white rounded-2xl px-5 py-4"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <h1 className="text-[18px] font-bold text-gray-900">Dashboard</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Your activity overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={FileText} label="Total posts" iconColor="#1877F2"
          value={stats.posts_total}
          sub={`${stats.posts_this_week ?? 0} this week`}
          trend={stats.posts_trend}
        />
        <StatCard
          icon={MessageCircle} label="Comments received" iconColor="#42B883"
          value={stats.comments_received}
          sub={`${stats.comments_this_month ?? 0} this month`}
        />
        <StatCard
          icon={Heart} label="Reactions received" iconColor="#F33E58"
          value={stats.reactions_total}
          sub={`${stats.reactions_this_month ?? 0} this month`}
        />
        <StatCard
          icon={TrendingUp} label="Posts this week" iconColor="#F7B125"
          value={stats.posts_this_week}
          sub={`${stats.posts_last_week ?? 0} last week`}
          trend={stats.posts_trend}
        />
      </div>

      {/* Weekly goal */}
      <div
        className="scale-in bg-white rounded-2xl px-5 py-4 space-y-3"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[15px] text-gray-900">Weekly goal</p>
          <span className="text-[13px] font-semibold text-[#1877F2]">{goalPct}%</span>
        </div>
        <div className="flex justify-between text-[13px] text-gray-400">
          <span>{goal.progress} / {goal.target} posts</span>
          {goalPct >= 100 && <span className="text-green-500 font-semibold">🎉 Goal reached!</span>}
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${goalPct}%`,
              background: goalPct >= 100 ? '#22c55e' : 'linear-gradient(90deg, #1877F2, #4facfe)',
            }}
          />
        </div>
      </div>

      {/* Engagement chart */}
      {series.length > 0 && (
        <div
          className="scale-in bg-white rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-[15px] text-gray-900">Engagement (last 8 months)</p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm inline-block" style={{ background: '#1877F2' }} />Posts</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm inline-block" style={{ background: '#F33E58' }} />Reactions</span>
            </div>
          </div>
          <EngagementChart series={series} />
        </div>
      )}

      {/* Recent activity */}
      {activity.length > 0 && (
        <div
          className="scale-in bg-white rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <p className="font-semibold text-[15px] text-gray-900 mb-3">Recent comments on your posts</p>
          <div className="space-y-3">
            {activity.map((c) => (
              <Link key={c.id} to={`/posts/${c.post?.uuid}`} className="flex items-start gap-3 group">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)' }}
                >
                  {c.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px]">
                    <span className="font-semibold text-gray-900">{c.user?.name}</span>
                    <span className="text-gray-500"> commented on </span>
                    <span className="font-medium text-gray-700 group-hover:text-[#1877F2] transition-colors truncate">
                      {c.post?.body?.slice(0, 40) || 'your post'}
                    </span>
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5 truncate">{c.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
