import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminReports, reviewReport, resolveReport, dismissReport } from '../../api/admin'
import useThemeStore from '../../store/themeStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { Button } from '../../components/ui/button'
import { Loader2, Flag, FileText, MessageSquare, User as UserIcon, Eye, Check, X, ExternalLink } from 'lucide-react'
import { formatDistanceToNow, assetUrl } from '../../lib/utils'
import { toast } from 'sonner'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
]

const TYPE_TABS = [
  { key: '', label: 'All types' },
  { key: 'post', label: 'Posts' },
  { key: 'comment', label: 'Comments' },
  { key: 'user', label: 'Users' },
]

const STATUS_STYLE = {
  pending:   { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  reviewed:  { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
  resolved:  { bg: 'oklch(0.46 0.15 143 / 0.12)', color: 'oklch(0.46 0.15 143)' },
  dismissed: { bg: 'rgba(107,114,128,0.14)', color: '#6b7280' },
}

function shortType(reportableType) {
  if (!reportableType) return 'unknown'
  return reportableType.split('\\').pop().toLowerCase() // App\Models\Post -> post
}

function TypeIcon({ type }) {
  if (type === 'post') return <FileText className="h-4 w-4" />
  if (type === 'comment') return <MessageSquare className="h-4 w-4" />
  if (type === 'user') return <UserIcon className="h-4 w-4" />
  return <Flag className="h-4 w-4" />
}

// Inline preview of the reported entity (post/comment/user), or a tombstone if deleted
function ReportablePreview({ type, reportable, dark }) {
  const box = {
    background: dark ? 'rgba(255,255,255,0.04)' : '#f7f8fa',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
  }
  if (!reportable) {
    return (
      <div className="rounded-xl px-3 py-2.5 text-[13px] italic text-gray-400" style={box}>
        The reported {type} no longer exists (deleted).
      </div>
    )
  }
  if (type === 'user') {
    return (
      <Link to={`/users/${reportable.uuid}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-opacity hover:opacity-80" style={box}>
        {reportable.avatar ? (
          <img src={assetUrl(reportable.avatar)} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-primary">
            {reportable.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">{reportable.name}</span>
        <ExternalLink className="h-3.5 w-3.5 text-gray-400 ml-auto" />
      </Link>
    )
  }
  // post or comment — both have a body; posts are linkable
  const body = reportable.body || '(no text)'
  const inner = (
    <div className="rounded-xl px-3 py-2.5" style={box}>
      <p className="text-[13px] text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">{body}</p>
      {type === 'post' && (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary mt-1.5">
          View post <ExternalLink className="h-3 w-3" />
        </span>
      )}
    </div>
  )
  return type === 'post' && reportable.uuid
    ? <Link to={`/posts/${reportable.uuid}`} className="block transition-opacity hover:opacity-80">{inner}</Link>
    : inner
}

function ReportCard({ report, dark, onReview, onResolve, onDismiss, pending }) {
  const type = shortType(report.reportable_type)
  const st = STATUS_STYLE[report.status] ?? STATUS_STYLE.dismissed
  const isOpen = report.status === 'pending' || report.status === 'reviewed'

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: dark ? '#e4e6eb' : '#374151' }}>
            <TypeIcon type={type} /> {type}
          </span>
          <span className="text-[12px] font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: st.bg, color: st.color }}>
            {report.status}
          </span>
        </div>
        <span className="text-[12px] text-gray-400 shrink-0">{formatDistanceToNow(report.created_at)}</span>
      </div>

      {/* Reporter + reason */}
      <div>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          Reported by{' '}
          {report.reporter
            ? <Link to={`/users/${report.reporter.uuid}`} className="font-semibold text-gray-800 dark:text-gray-200 hover:underline">{report.reporter.name}</Link>
            : <span className="font-semibold">Unknown</span>}
        </p>
        <p className="text-[14px] text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{report.reason}</p>
      </div>

      {/* Reported entity preview */}
      <ReportablePreview type={type} reportable={report.reportable} dark={dark} />

      {/* Resolution note / reviewer (for closed reports) */}
      {report.resolution_note && (
        <p className="text-[13px] border-l-2 border-primary/40 pl-3 text-gray-500 dark:text-gray-400 italic">
          {report.resolution_note}
        </p>
      )}
      {!isOpen && report.reviewer && (
        <p className="text-[12px] text-gray-400">Handled by {report.reviewer.name}</p>
      )}

      {/* Actions */}
      {isOpen && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {report.status === 'pending' && (
            <button
              onClick={() => onReview(report)}
              disabled={pending}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'rgba(59,130,246,0.12)', color: '#2563eb' }}
            >
              <Eye className="h-4 w-4" /> Mark reviewed
            </button>
          )}
          <button
            onClick={() => onResolve(report)}
            disabled={pending}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'oklch(0.46 0.15 143)' }}
          >
            <Check className="h-4 w-4" /> Resolve
          </button>
          <button
            onClick={() => onDismiss(report)}
            disabled={pending}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50"
            style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: dark ? '#e4e6eb' : '#374151' }}
          >
            <X className="h-4 w-4" /> Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminReportsPage() {
  const { dark } = useThemeStore()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [type, setType] = useState('')
  const [dialog, setDialog] = useState(null) // { mode: 'resolve'|'dismiss', report }
  const [note, setNote] = useState('')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['admin-reports', status, type],
    queryFn: ({ pageParam = 1 }) => getAdminReports({ status, type, page: pageParam }).then((r) => r.data),
    getNextPageParam: (last) => last.data.current_page < last.data.last_page ? last.data.current_page + 1 : undefined,
  })

  const reports = data?.pages.flatMap((p) => p.data.data) ?? []
  const counts = data?.pages[0]?.counts ?? {}
  const total = (counts.pending ?? 0) + (counts.reviewed ?? 0) + (counts.resolved ?? 0) + (counts.dismissed ?? 0)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] })

  const reviewMut = useMutation({
    mutationFn: (r) => reviewReport(r.uuid),
    onSuccess: () => { invalidate(); toast.success('Marked as reviewed') },
    onError: () => toast.error('Action failed'),
  })
  const resolveMut = useMutation({
    mutationFn: ({ uuid, note }) => resolveReport(uuid, note),
    onSuccess: () => { invalidate(); closeDialog(); toast.success('Report resolved') },
    onError: () => toast.error('Could not resolve report'),
  })
  const dismissMut = useMutation({
    mutationFn: ({ uuid, note }) => dismissReport(uuid, note),
    onSuccess: () => { invalidate(); closeDialog(); toast.success('Report dismissed') },
    onError: () => toast.error('Could not dismiss report'),
  })

  const closeDialog = () => { setDialog(null); setNote('') }
  const actionPending = reviewMut.isPending || resolveMut.isPending || dismissMut.isPending

  const submitDialog = () => {
    if (!dialog) return
    if (dialog.mode === 'resolve') {
      if (!note.trim()) return
      resolveMut.mutate({ uuid: dialog.report.uuid, note: note.trim() })
    } else {
      dismissMut.mutate({ uuid: dialog.report.uuid, note: note.trim() || undefined })
    }
  }

  const tabCount = (key) => key === '' ? total : (counts[key] ?? 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {STATUS_TABS.map((t) => {
          const active = status === t.key
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className="cursor-pointer flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors"
              style={{
                background: active ? 'oklch(0.46 0.15 143)' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                color: active ? '#fff' : (dark ? '#9ca3af' : '#6b7280'),
              }}
            >
              {t.label}
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: active ? 'rgba(255,255,255,0.25)' : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') }}>
                {tabCount(t.key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_TABS.map((t) => {
          const active = type === t.key
          return (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className="cursor-pointer px-3 py-1 rounded-full text-[12px] font-semibold transition-colors"
              style={{
                background: active ? 'oklch(0.46 0.15 143 / 0.12)' : 'transparent',
                color: active ? 'oklch(0.46 0.15 143)' : (dark ? '#9ca3af' : '#6b7280'),
                border: `1px solid ${active ? 'oklch(0.46 0.15 143 / 0.3)' : (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')}`,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}>
          <Flag className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No reports here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard
              key={r.uuid}
              report={r}
              dark={dark}
              pending={actionPending}
              onReview={(rep) => reviewMut.mutate(rep)}
              onResolve={(rep) => { setDialog({ mode: 'resolve', report: rep }); setNote('') }}
              onDismiss={(rep) => { setDialog({ mode: 'dismiss', report: rep }); setNote('') }}
            />
          ))}
          {hasNextPage && (
            <Button variant="outline" className="w-full rounded-xl" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
            </Button>
          )}
        </div>
      )}

      {/* Resolve / Dismiss dialog */}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === 'resolve' ? 'Resolve report' : 'Dismiss report'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              autoFocus
              placeholder={dialog?.mode === 'resolve'
                ? 'How was this resolved? (e.g. Content removed, user warned.)'
                : 'Optional note (e.g. No violation found.)'}
              rows={4}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/2000</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={submitDialog}
              disabled={actionPending || (dialog?.mode === 'resolve' && !note.trim())}
              style={{ background: 'oklch(0.46 0.15 143)', color: '#fff' }}
            >
              {actionPending ? 'Saving…' : dialog?.mode === 'resolve' ? 'Resolve' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
