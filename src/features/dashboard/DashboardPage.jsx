import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../../api/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Loader2, FileText, MessageCircle, Heart, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="pt-4 flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={FileText} label="Posts" value={data?.posts_count} />
        <StatCard icon={MessageCircle} label="Comments" value={data?.comments_count} />
        <StatCard icon={Heart} label="Reactions received" value={data?.reactions_count} />
        <StatCard icon={TrendingUp} label="This week" value={data?.weekly_posts} />
      </div>

      {data?.weekly_goal !== undefined && (
        <Card>
          <CardHeader><CardTitle className="text-base">Weekly goal</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{data.weekly_posts ?? 0} / 20 posts</span>
              <span className="text-muted-foreground">{Math.min(100, Math.round(((data.weekly_posts ?? 0) / 20) * 100))}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, ((data.weekly_posts ?? 0) / 20) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {data?.engagement_series?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Engagement (last 8 months)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {data.engagement_series.map((point, i) => {
                const max = Math.max(...data.engagement_series.map((p) => p.value ?? 0), 1)
                const height = Math.max(4, ((point.value ?? 0) / max) * 100)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-primary rounded-sm" style={{ height: `${height}%` }} />
                    <span className="text-[10px] text-muted-foreground">{point.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
