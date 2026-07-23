import { useInfiniteQuery } from '@tanstack/react-query'
import { getMyReports } from '../../api/reports'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'

// The API serializes the Report model, which has no `type` column — the target
// kind lives in the polymorphic `reportable_type` (e.g. "App\\Models\\Post").
const reportTypeLabel = (reportableType) =>
  reportableType?.split('\\').pop()?.toLowerCase() ?? 'item'

const STATUS_VARIANTS = {
  pending: 'secondary',
  reviewed: 'outline',
  resolved: 'default',
  dismissed: 'destructive',
}

export default function MyReportsPage() {
  const queryKey = ['my-reports']

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getMyReports(pageParam).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
  })

  const reports = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Reports</h1>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {!isLoading && reports.length === 0 && <p className="text-center text-muted-foreground py-12">No reports filed.</p>}

      {reports.map((report) => (
        <Card key={report.uuid}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{reportTypeLabel(report.reportable_type)}</Badge>
                <Badge variant={STATUS_VARIANTS[report.status] ?? 'secondary'} className="capitalize">{report.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(report.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{report.reason}</p>
            {report.resolution_note && (
              <p className="text-sm border-l-2 pl-3 text-muted-foreground italic">
                Resolution: {report.resolution_note}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {hasNextPage && (
        <Button variant="outline" className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
        </Button>
      )}
    </div>
  )
}
