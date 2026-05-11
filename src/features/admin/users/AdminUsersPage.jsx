import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, banUser, unbanUser, deleteAdminUser } from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Loader2, ShieldBan, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../../lib/utils'

const ROLES = ['user', 'moderator', 'admin', 'super_admin']
const ROLE_COLORS = { user: 'secondary', moderator: 'outline', admin: 'default', super_admin: 'destructive' }

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [banDialog, setBanDialog] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [banExpiry, setBanExpiry] = useState('')
  const queryKey = ['admin-users', search, role, page]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAdminUsers({ search: search || undefined, role: role === 'all' ? undefined : role, page }).then((r) => r.data),
  })

  const banMutation = useMutation({
    mutationFn: (u) => banUser(u.uuid, { reason: banReason, expires_at: banExpiry || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User banned'); setBanDialog(null); setBanReason(''); setBanExpiry('') },
    onError: () => toast.error('Failed to ban user'),
  })

  const unbanMutation = useMutation({
    mutationFn: (uuid) => unbanUser(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User unbanned') },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid) => deleteAdminUser(uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted') },
  })

  const users = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="flex gap-3">
        <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uuid}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><Badge variant={ROLE_COLORS[u.role] ?? 'secondary'} className="capitalize">{u.role?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(u.created_at)}</TableCell>
                  <TableCell>{u.is_banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="outline">Active</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {u.is_banned
                        ? <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => unbanMutation.mutate(u.uuid)}><ShieldCheck className="h-4 w-4" /></Button>
                        : <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setBanDialog(u)}><ShieldBan className="h-4 w-4" /></Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(u.uuid)}><Trash2 className="h-4 w-4" /></Button>
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

      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ban {banDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Reason</Label><Input value={banReason} onChange={(e) => setBanReason(e.target.value)} /></div>
            <div className="space-y-1"><Label>Expires at (empty = permanent)</Label><Input type="datetime-local" value={banExpiry} onChange={(e) => setBanExpiry(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!banReason.trim() || banMutation.isPending} onClick={() => banMutation.mutate(banDialog)}>
              {banMutation.isPending ? 'Banning…' : 'Ban user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
