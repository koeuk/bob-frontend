import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, banUser, unbanUser, assignRole } from '../../api/admin'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Loader2, Search, Users, Ban, ShieldCheck, ShieldX, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'
import { toast } from 'sonner'

const ROLE_TABS = [
  { key: '', label: 'All' },
  { key: 'user', label: 'Users' },
  { key: 'moderator', label: 'Moderators' },
  { key: 'admin', label: 'Admins' },
  { key: 'super_admin', label: 'Super Admins' },
]

const ROLE_OPTIONS = ['user', 'moderator', 'admin', 'super_admin']

const ROLE_STYLE = {
  super_admin: { bg: 'rgba(139,92,246,0.14)', color: '#7c3aed', label: 'Super Admin' },
  admin:       { bg: 'oklch(0.46 0.15 143 / 0.12)', color: 'oklch(0.46 0.15 143)', label: 'Admin' },
  moderator:   { bg: 'rgba(16,185,129,0.14)', color: '#059669', label: 'Moderator' },
  user:        { bg: 'rgba(107,114,128,0.14)', color: '#6b7280', label: 'User' },
}

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] ?? ROLE_STYLE.user
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function UserRow({ u, dark, isSuperAdmin, isMe, onBan, onUnban, onRole, pending }) {
  const banned = u.bans?.length > 0
  const activeBan = banned ? u.bans[0] : null
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-primary">
          {u.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/users/${u.uuid}`} className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 hover:underline truncate inline-flex items-center gap-1">
              {u.name}<ExternalLink className="h-3 w-3 text-gray-400" />
            </Link>
            <RoleBadge role={u.role} />
            {banned && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.14)', color: '#dc2626' }}>Banned</span>}
            {isMe && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: dark ? '#9ca3af' : '#6b7280' }}>You</span>}
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {u.posts_count ?? 0} posts · {u.comments_count ?? 0} comments · joined {formatDistanceToNow(u.created_at)}
          </p>
          {activeBan?.reason && (
            <p className="text-[12px] mt-1.5 border-l-2 border-red-400/50 pl-2 text-red-500/90 italic">
              Banned: {activeBan.reason}{activeBan.expires_at ? ` (until ${new Date(activeBan.expires_at).toLocaleDateString()})` : ' (permanent)'}
            </p>
          )}
        </div>
      </div>

      {!isMe && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {banned ? (
            <button
              onClick={() => onUnban(u)}
              disabled={pending}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'oklch(0.46 0.15 143 / 0.12)', color: 'oklch(0.46 0.15 143)' }}
            >
              <ShieldCheck className="h-4 w-4" /> Unban
            </button>
          ) : (
            <button
              onClick={() => onBan(u)}
              disabled={pending}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}
            >
              <Ban className="h-4 w-4" /> Ban
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => onRole(u)}
              disabled={pending}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: dark ? '#e4e6eb' : '#374151' }}
            >
              <ShieldX className="h-4 w-4" /> Change role
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const { user: me } = useAuthStore()
  const { dark } = useThemeStore()
  const queryClient = useQueryClient()
  const isSuperAdmin = me?.role === 'super_admin'

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [bannedOnly, setBannedOnly] = useState(false)
  const [banDialog, setBanDialog] = useState(null) // user
  const [banReason, setBanReason] = useState('')
  const [banExpiry, setBanExpiry] = useState('')
  const [roleDialog, setRoleDialog] = useState(null) // user
  const [roleChoice, setRoleChoice] = useState('user')

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['admin-users', search, role, bannedOnly],
    queryFn: ({ pageParam = 1 }) => getAdminUsers({ search, role, banned: bannedOnly, page: pageParam }).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
  })

  const users = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const banMut = useMutation({
    mutationFn: ({ uuid, reason, expires_at }) => banUser(uuid, { reason, expires_at }),
    onSuccess: () => { invalidate(); closeBan(); toast.success('User banned') },
    onError: () => toast.error('Could not ban user'),
  })
  const unbanMut = useMutation({
    mutationFn: (uuid) => unbanUser(uuid),
    onSuccess: () => { invalidate(); toast.success('User unbanned') },
    onError: () => toast.error('Could not unban user'),
  })
  const roleMut = useMutation({
    mutationFn: ({ uuid, role }) => assignRole(uuid, role),
    onSuccess: () => { invalidate(); closeRole(); toast.success('Role updated') },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not change role'),
  })

  const pending = banMut.isPending || unbanMut.isPending || roleMut.isPending

  const closeBan = () => { setBanDialog(null); setBanReason(''); setBanExpiry('') }
  const closeRole = () => { setRoleDialog(null) }

  const openBan = (u) => { setBanDialog(u); setBanReason(''); setBanExpiry('') }
  const openRole = (u) => { setRoleDialog(u); setRoleChoice(u.role) }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
        {total > 0 && <span className="text-[13px] text-gray-400">({total})</span>}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9 rounded-xl h-10 bg-white dark:bg-[#242526] border-gray-200 dark:border-white/10"
        />
      </div>

      {/* Role tabs + banned toggle */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {ROLE_TABS.map((t) => {
          const active = role === t.key
          return (
            <button
              key={t.key}
              onClick={() => setRole(t.key)}
              className="cursor-pointer px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                background: active ? 'oklch(0.46 0.15 143)' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                color: active ? '#fff' : (dark ? '#9ca3af' : '#6b7280'),
              }}
            >
              {t.label}
            </button>
          )
        })}
        <button
          onClick={() => setBannedOnly((v) => !v)}
          className="cursor-pointer ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
          style={{
            background: bannedOnly ? 'rgba(239,68,68,0.12)' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
            color: bannedOnly ? '#dc2626' : (dark ? '#9ca3af' : '#6b7280'),
          }}
        >
          <Ban className="h-4 w-4" /> Banned only
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}>
          <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No users found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserRow
              key={u.uuid}
              u={u}
              dark={dark}
              isSuperAdmin={isSuperAdmin}
              isMe={u.uuid === me?.uuid}
              pending={pending}
              onBan={openBan}
              onUnban={(usr) => unbanMut.mutate(usr.uuid)}
              onRole={openRole}
            />
          ))}
          {hasNextPage && (
            <Button variant="outline" className="w-full rounded-xl" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
            </Button>
          )}
        </div>
      )}

      {/* Ban dialog */}
      <Dialog open={!!banDialog} onOpenChange={(v) => !v && closeBan()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ban {banDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Reason</label>
              <Textarea
                autoFocus
                placeholder="Why is this user being banned?"
                rows={3}
                maxLength={2000}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Expires (optional)</label>
              <Input
                type="datetime-local"
                value={banExpiry}
                onChange={(e) => setBanExpiry(e.target.value)}
                className="rounded-xl h-10"
              />
              <p className="text-[12px] text-gray-400">Leave empty for a permanent ban.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeBan}>Cancel</Button>
            <Button
              onClick={() => banMut.mutate({ uuid: banDialog.uuid, reason: banReason.trim(), expires_at: banExpiry || null })}
              disabled={pending || !banReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {banMut.isPending ? 'Banning…' : 'Ban user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(v) => !v && closeRole()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change role — {roleDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((r) => {
              const s = ROLE_STYLE[r]
              const active = roleChoice === r
              return (
                <button
                  key={r}
                  onClick={() => setRoleChoice(r)}
                  className="cursor-pointer px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
                  style={{
                    background: active ? s.bg : (dark ? 'rgba(255,255,255,0.04)' : '#f7f8fa'),
                    color: active ? s.color : (dark ? '#9ca3af' : '#6b7280'),
                    border: `1.5px solid ${active ? s.color : 'transparent'}`,
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRole}>Cancel</Button>
            <Button
              onClick={() => roleMut.mutate({ uuid: roleDialog.uuid, role: roleChoice })}
              disabled={pending || roleChoice === roleDialog?.role}
              style={{ background: 'oklch(0.46 0.15 143)', color: '#fff' }}
            >
              {roleMut.isPending ? 'Saving…' : 'Update role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
