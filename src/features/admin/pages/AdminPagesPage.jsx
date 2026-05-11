import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminPages, createAdminPage, updateAdminPage, deleteAdminPage } from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { Loader2, Trash2, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../../lib/utils'

const empty = { slug: '', title: '', body: '', status: 'draft' }

export default function AdminPagesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [sheet, setSheet] = useState(null)
  const [form, setForm] = useState(empty)
  const queryKey = ['admin-pages', page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAdminPages({ page }).then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: () => sheet === 'new' ? createAdminPage(form) : updateAdminPage(sheet, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pages'] }); toast.success('Saved'); setSheet(null) },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid) => deleteAdminPage(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-pages'] }); toast.success('Deleted') },
  })

  const pages = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pages</h1>
        <Button size="sm" onClick={() => { setForm(empty); setSheet('new') }}><Plus className="h-4 w-4 mr-1" /> New page</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.uuid}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{p.slug}</TableCell>
                  <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(p.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm({ slug: p.slug, title: p.title, body: p.body, status: p.status }); setSheet(p.uuid) }}><Pencil className="h-4 w-4" /></Button>
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

      <Sheet open={!!sheet} onOpenChange={() => setSheet(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{sheet === 'new' ? 'New page' : 'Edit page'}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Body</Label><Textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <Button className="w-full" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Saving…' : 'Save page'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
