
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markRead, markAllRead } from '../../api/notifications'
import { acceptFriendRequest, declineFriendRequest } from '../../api/friends'
import { Bell, ThumbsUp, MessageCircle, CheckCheck, UserPlus, Users } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'
import useThemeStore from '../../store/themeStore'

const REACTION_EMOJIS = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡' }

function NotifIcon({ type }) {
  if (type === 'post_liked') return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#1877F2,#4facfe)' }}>
      <ThumbsUp className="h-5 w-5 text-white fill-white" />
    </div>
  )
  if (type === 'friend_request') return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#8B5CF6,#a78bfa)' }}>
      <UserPlus className="h-5 w-5 text-white" />
    </div>
  )
  if (type === 'friend_accepted') return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}>
      <Users className="h-5 w-5 text-white" />
    </div>
  )
  return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#25c267,#4ade80)' }}>
      <MessageCircle className="h-5 w-5 text-white" />
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

function FriendRequestActions({ notif, onResolve }) {
  const queryClient = useQueryClient()

  // Use the status from the backend (survives refresh), fall back to local optimistic state
  const serverStatus = notif.data.friend_request_status
  const isAlreadyHandled = serverStatus === 'accepted' || serverStatus === 'declined'

  const updateStatus = (status) => {
    // Optimistically update the cached notification data so UI updates instantly
    queryClient.setQueryData(['notifications'], (old) => {
      if (!old) return old
      const updated = old.notifications.data.map((n) =>
        n.id === notif.id
          ? { ...n, data: { ...n.data, friend_request_status: status } }
          : n
      )
      return {
        ...old,
        unread_count: !notif.read_at ? Math.max(0, (old.unread_count ?? 0) - 1) : old.unread_count,
        notifications: { ...old.notifications, data: updated },
      }
    })
    onResolve(notif.id, status)
  }

  const acceptMutation = useMutation({
    mutationFn: () => acceptFriendRequest(notif.data.friend_request_id),
    onSuccess: () => updateStatus('accepted'),
    onError: () => updateStatus('accepted'),
  })

  const declineMutation = useMutation({
    mutationFn: () => declineFriendRequest(notif.data.friend_request_id),
    onSuccess: () => updateStatus('declined'),
  })

  if (isAlreadyHandled) {
    return (
      <span className="text-[12px] font-semibold" style={{ color: serverStatus === 'accepted' ? '#10b981' : '#9ca3af' }}>
        {serverStatus === 'accepted' ? 'Now friends ✓' : 'Declined'}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); acceptMutation.mutate() }}
        disabled={acceptMutation.isPending || declineMutation.isPending}
        className="cursor-pointer px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#1877F2,#4facfe)' }}
      >
        {acceptMutation.isPending ? 'Accepting…' : 'Accept'}
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); declineMutation.mutate() }}
        disabled={acceptMutation.isPending || declineMutation.isPending}
        className="cursor-pointer px-4 py-1.5 rounded-full text-[13px] font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/15 disabled:opacity-50"
        style={{ background: 'rgba(0,0,0,0.06)' }}
      >
        Decline
      </button>
    </div>
  )
}

function NotifItem({ notif, onMarkRead, onResolve }) {
  const unreadBg = 'rgba(24,119,242,0.05)'
  const isFriendRequest = notif.data.type === 'friend_request'
  const isPostNotif = notif.data.type === 'post_liked' || notif.data.type === 'post_commented'

  const sharedClass = `flex items-start gap-4 px-5 py-4 transition-colors duration-150 cursor-pointer ${
    notif.read_at
      ? 'hover:bg-gray-50 dark:hover:bg-white/5'
      : 'hover:bg-blue-50/60 dark:hover:bg-blue-900/20'
  }`
  const sharedStyle = !notif.read_at ? { background: unreadBg } : {}

  const inner = (
    <>
      <NotifIcon type={notif.data.type} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-snug">
          {notifText(notif.data)}
        </p>
        {isFriendRequest && (
          <FriendRequestActions notif={notif} onResolve={onResolve} />
        )}
        <p className="text-[12px] text-[#1877F2] font-medium mt-1.5">
          {formatDistanceToNow(notif.created_at)}
        </p>
      </div>
      {!notif.read_at && (
        <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-2" style={{ background: '#1877F2' }} />
      )}
    </>
  )

  if (isPostNotif) {
    return (
      <Link
        to={`/posts/${notif.data.post_uuid}`}
        onClick={() => onMarkRead(notif.id)}
        className={sharedClass}
        style={sharedStyle}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div onClick={() => onMarkRead(notif.id)} className={sharedClass} style={sharedStyle}>
      {inner}
    </div>
  )
}

export default function NotificationsPage() {
  const { dark } = useThemeStore()
  const queryClient = useQueryClient()
  const queryKey = ['notifications']
  const handleResolve = () => {}

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getNotifications().then(r => r.data),
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

  const notifications = data?.notifications?.data ?? []
  const unreadCount = data?.unread_count ?? 0

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: dark ? 'rgba(36,37,38,0.97)' : 'rgba(255,255,255,0.92)',
      boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.08)',
    }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <h1 className="font-bold text-[20px] text-gray-900 dark:text-gray-100">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="cursor-pointer flex items-center gap-1.5 text-[13px] font-semibold text-[#1877F2] hover:text-[#166FE5] transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-[14px]">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Bell className="h-12 w-12 opacity-25" />
          <p className="text-[15px] font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-white/08">
          {notifications.map((notif) => (
            <NotifItem
              key={notif.id}
              notif={notif}
              onMarkRead={(id) => { if (!notif.read_at) markReadMutation.mutate(id) }}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  )
}
