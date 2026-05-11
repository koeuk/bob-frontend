import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminReports, reviewReport, resolveReport, dismissReport } from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../../lib/utils'

const STATUS_COLORS = { pending: 'destructive', reviewed: 'secondary', resolved: 'default', dismissed: 'outline' }

export default function AdminReportsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [resolveDialog, setResolveDialog] = useState(null)
  const [note, setNote] = useState('')
  const queryKey = ['admin-reports', status, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAdminReports({ status: status === 'all' ? undefined : status, page }).then((r) => r.data),
  })

  const reviewMutation = useMutation({
    mutationFn: (uuid) => reviewReport(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); toast.success('Marked reviewed') },
  })

  const resolveMutation = useMutation({
    mutationFn: ({ uuid, action }) => action === 'resolve' ? resolveReport(uuid, { resolution_note: note }) : dismissReport(uuid, { resolution_note: note }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); toast.success('Report updated'); setResolveDialog(null); setNote('') },
  })

  const reports = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.uuid}>
                  <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{r.reason}</TableCell>
                  <TableCell className="text-sm">{r.reporter?.name}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[r.status] ?? 'secondary'} className="capitalize">{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDistanceToNow(r.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {r.status === 'pending' && <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate(r.uuid)}>Review</Button>}
                      {['pending', 'reviewed'].includes(r.status) && <>
                        <Button size="sm" variant="outline" onClick={() => setResolveDialog({ uuid: r.uuid, action: 'resolve' })}>Resolve</Button>
                        <Button size="sm" variant="ghost" onClick={() => setResolveDialog({ uuid: r.uuid, action: 'dismiss' })}>Dismiss</Button>
                      </>}
                    </div>
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

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{resolveDialog?.action} report</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Note (optional)</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>Cancel</Button>
            <Button onClick={() => resolveMutation.mutate(resolveDialog)} disabled={resolveMutation.isPending}>
              {resolveMutation.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
