import { useQuery } from '@tanstack/react-query'
import { getAdminDashboard } from '../../../api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Loader2, Users, FileText, Flag, ShieldBan } from 'lucide-react'

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="pt-4 flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <div>
          <p className="text-2xl font-bold">{value ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getAdminDashboard().then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={data?.users_count} />
        <StatCard icon={FileText} label="Total posts" value={data?.posts_count} />
        <StatCard icon={Flag} label="Pending reports" value={data?.pending_reports_count} />
        <StatCard icon={ShieldBan} label="Active bans" value={data?.active_bans_count} />
      </div>
      {data?.recent_reports?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.recent_reports.map((r) => (
              <div key={r.uuid} className="flex justify-between text-sm border-b pb-2 last:border-0">
                <span className="capitalize">{r.type} — {r.reason?.slice(0, 60)}</span>
                <span className="text-muted-foreground capitalize">{r.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
