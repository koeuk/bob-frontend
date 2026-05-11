import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminComments, deleteAdminComment } from '../../../api/admin'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../../lib/utils'

export default function AdminCommentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const queryKey = ['admin-comments', search, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAdminComments({ search: search || undefined, page }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid) => deleteAdminComment(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-comments'] }); toast.success('Comment deleted') },
  })

  const comments = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comments</h1>
      <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Body</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((c) => (
                <TableRow key={c.uuid}>
                  <TableCell className="font-medium whitespace-nowrap">{c.user?.name}</TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground">{c.body}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDistanceToNow(c.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(c.uuid)}><Trash2 className="h-4 w-4" /></Button>
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
