import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminPosts, deleteAdminPost, flagAdminPost } from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Loader2, Trash2, Eye, EyeOff, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../../lib/utils'

const STATUS_COLORS = { active: 'default', flagged: 'secondary', hidden: 'outline' }

export default function AdminPostsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const queryKey = ['admin-posts', search, status, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAdminPosts({ search: search || undefined, status: status === 'all' ? undefined : status, page }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid) => deleteAdminPost(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-posts'] }); toast.success('Post deleted') },
  })

  const flagMutation = useMutation({
    mutationFn: ({ uuid, newStatus }) => flagAdminPost(uuid, { status: newStatus }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-posts'] }); toast.success('Status updated') },
  })

  const posts = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Posts</h1>
      <div className="flex gap-3">
        <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Body</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.uuid}>
                  <TableCell className="font-medium whitespace-nowrap">{p.user?.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{p.body}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[p.status] ?? 'secondary'} className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDistanceToNow(p.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {p.status !== 'active' && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => flagMutation.mutate({ uuid: p.uuid, newStatus: 'active' })}><Eye className="h-4 w-4" /></Button>}
                      {p.status !== 'flagged' && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => flagMutation.mutate({ uuid: p.uuid, newStatus: 'flagged' })}><Flag className="h-4 w-4" /></Button>}
                      {p.status !== 'hidden' && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => flagMutation.mutate({ uuid: p.uuid, newStatus: 'hidden' })}><EyeOff className="h-4 w-4" /></Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.uuid)}><Trash2 className="h-4 w-4" /></Button>
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
    </div>
  )
}
