import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markRead, markAllRead } from '../../api/notifications'
import { acceptFriendRequest, declineFriendRequest } from '../../api/friends'
import { Bell, ThumbsUp, MessageCircle, CheckCheck, UserPlus, Users } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'
import { toast } from 'sonner'

const REACTION_EMOJIS = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡' }

function NotifIcon({ type }) {
  if (type === 'post_liked') return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'oklch(0.46 0.15 143)' }}>
      <ThumbsUp className="h-4 w-4 text-white fill-white" />
    </div>
  )
  if (type === 'friend_request') return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#8B5CF6,#a78bfa)' }}>
      <UserPlus className="h-4 w-4 text-white" />
    </div>
  )
  if (type === 'friend_accepted') return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}>
      <Users className="h-4 w-4 text-white" />
    </div>
  )
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#25c267,#4ade80)' }}>
      <MessageCircle className="h-4 w-4 text-white" />
    </div>
  )
}

function notifText(data) {
  if (data.type === 'post_liked') {
    const emoji = REACTION_EMOJIS[data.reaction] ?? '👍'
    return <><strong>{data.actor_name}</strong> reacted {emoji} to your post{data.post_excerpt ? `: "${data.post_excerpt}"` : ''}</>
  }
  if (data.type === 'friend_request') {
    return <><strong>{data.actor_name}</strong> sent you a friend request</>
  }
  if (data.type === 'friend_accepted') {
    return <><strong>{data.actor_name}</strong> accepted your friend request</>
  }
  return <><strong>{data.actor_name}</strong> commented on your post{data.comment_excerpt ? `: "${data.comment_excerpt}"` : ''}</>
}

function FriendRequestActions({ notif, onDone }) {
  const queryClient = useQueryClient()
  const [resolved, setResolved] = useState(false)
  const [result, setResult] = useState(null)

  const decrementUnread = () => {
    if (!notif.read_at) {
      queryClient.setQueryData(['notifications'], (old) =>
        old ? { ...old, unread_count: Math.max(0, (old.unread_count ?? 0) - 1) } : old
      )
    }
  }

  const acceptMutation = useMutation({
    mutationFn: () => acceptFriendRequest(notif.data.friend_request_id),
    // onDone() marks the notification read server-side; without it the refetch
    // re-increments unread_count since accept/decline don't touch the notif.
    onSuccess: () => { setResolved(true); setResult('accepted'); decrementUnread(); onDone?.() },
    // Never fake success: the request may already have been cancelled/handled
    // (the API 404s). Surface it and resync from the server instead.
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not accept request')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => declineFriendRequest(notif.data.friend_request_id),
    onSuccess: () => { setResolved(true); setResult('declined'); decrementUnread(); onDone?.() },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not decline request')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (resolved) {
    return (
      <span className="text-[11px] font-semibold" style={{ color: result === 'accepted' ? '#10b981' : '#9ca3af' }}>
        {result === 'accepted' ? 'Now friends ✓' : 'Declined'}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); acceptMutation.mutate() }}
        disabled={acceptMutation.isPending || declineMutation.isPending}
        className="cursor-pointer px-3 py-1 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'oklch(0.46 0.15 143)' }}
      >
        Accept
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); declineMutation.mutate() }}
        disabled={acceptMutation.isPending || declineMutation.isPending}
        className="cursor-pointer px-3 py-1 rounded-full text-[12px] font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/15 disabled:opacity-50"
        style={{ background: 'rgba(0,0,0,0.06)' }}
      >
        Decline
      </button>
    </div>
  )
}

function NotifItem({ notif, onMarkRead, onClose }) {
  const isDark = document.documentElement.classList.contains('dark')
  const unreadBg = isDark ? 'oklch(0.46 0.15 143 / 0.08)' : 'oklch(0.46 0.15 143 / 0.05)'
  const isFriendRequest = notif.data.type === 'friend_request'
  const isPostNotif = notif.data.type === 'post_liked' || notif.data.type === 'post_commented'

  const sharedClass = `flex items-start gap-3 px-4 py-3 transition-colors duration-150 ${
    notif.read_at ? 'hover:bg-gray-50 dark:hover:bg-white/5' : 'hover:bg-primary/10 dark:hover:bg-primary/20'
  }`
  const sharedStyle = !notif.read_at ? { background: unreadBg } : {}

  const content = (
    <>
      <NotifIcon type={notif.data.type} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
          {notifText(notif.data)}
        </p>
        {isFriendRequest && (
          <FriendRequestActions notif={notif} onDone={() => onMarkRead(notif.id)} />
        )}
        <p className="text-[12px] text-primary font-medium mt-1">
          {formatDistanceToNow(notif.created_at)}
        </p>
      </div>
      {!notif.read_at && (
        <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5" style={{ background: 'oklch(0.46 0.15 143)' }} />
      )}
    </>
  )

  if (isPostNotif) {
    return (
      <Link
        to={`/posts/${notif.data.post_uuid}`}
        onClick={() => { onMarkRead(notif.id); onClose() }}
        className={sharedClass}
        style={sharedStyle}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      onClick={() => onMarkRead(notif.id)}
      className={sharedClass}
      style={sharedStyle}
    >
      {content}
    </div>
  )
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 360 })
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const queryClient = useQueryClient()
  const queryKey = ['notifications']

  const { data } = useQuery({
    queryKey,
    queryFn: () => getNotifications().then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const panelWidth = Math.min(360, window.innerWidth - 16)
      const left = Math.max(8, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8))
      setPos({ top: rect.bottom + 8, left, width: panelWidth })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const notifications = data?.notifications?.data ?? []
  const unreadCount = data?.unread_count ?? 0
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <>
      <button
        ref={btnRef}
        title="Notifications"
        onClick={handleOpen}
        className="cursor-pointer relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shrink-0"
        style={{ background: 'rgba(0,0,0,0.05)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
      >
        <Bell className="h-[18px] w-[18px] text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full text-white text-[11px] font-bold flex items-center justify-center px-1 leading-none"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="scale-in fixed rounded-2xl overflow-hidden z-[9999]"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)' : '0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            background: isDark ? '#242526' : 'white',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <h3 className="font-bold text-[17px] text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="cursor-pointer flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <Bell className="h-10 w-10 opacity-30" />
                <p className="text-[14px] font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onMarkRead={(id) => { if (!notif.read_at) markReadMutation.mutate(id) }}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
