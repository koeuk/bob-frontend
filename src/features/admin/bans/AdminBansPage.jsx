import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminBans, deleteBan } from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../../lib/utils'

export default function AdminBansPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const queryKey = ['admin-bans', page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAdminBans({ page }).then((r) => r.data),
  })

  const liftMutation = useMutation({
    mutationFn: (uuid) => deleteBan(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-bans'] }); toast.success('Ban lifted') },
  })

  const bans = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bans</h1>
      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Banned by</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bans.map((b) => (
                <TableRow key={b.uuid}>
                  <TableCell className="font-medium">{b.user?.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{b.reason}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.banned_by_user?.name}</TableCell>
                  <TableCell>{b.expires_at ? formatDistanceToNow(b.expires_at) : <Badge variant="destructive">Permanent</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(b.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => liftMutation.mutate(b.uuid)}><ShieldCheck className="h-4 w-4" /></Button>
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
    </div>
  )
}
