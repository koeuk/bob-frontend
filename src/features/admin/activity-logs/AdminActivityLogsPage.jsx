import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActivityLogs } from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow } from '../../../lib/utils'

export default function AdminActivityLogsPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [detail, setDetail] = useState(null)
  const queryKey = ['admin-activity-logs', action, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getActivityLogs({ action: action || undefined, page }).then((r) => r.data),
  })

  const logs = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      <Input placeholder="Filter by action…" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className="max-w-xs" />

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.uuid}>
                  <TableCell className="font-medium">{log.admin?.name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{log.action}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">{log.target_type}</TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">{log.ip}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDistanceToNow(log.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {(log.before || log.after) && <Button size="sm" variant="ghost" onClick={() => setDetail(log)}>View diff</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Page {data.current_page} of {data.last_page}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-mono">{detail?.action}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm font-semibold mb-2 text-muted-foreground">Before</p><pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">{JSON.stringify(detail?.before, null, 2) || '—'}</pre></div>
            <div><p className="text-sm font-semibold mb-2 text-muted-foreground">After</p><pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">{JSON.stringify(detail?.after, null, 2) || '—'}</pre></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
