
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markRead, markAllRead } from '../../api/notifications'
import { acceptFriendRequest, declineFriendRequest } from '../../api/friends'
import { Bell, ThumbsUp, MessageCircle, CheckCheck, UserPlus, Users } from 'lucide-react'
import { formatDistanceToNow, assetUrl } from '../../lib/utils'
import useThemeStore from '../../store/themeStore'

const REACTION_EMOJIS = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡' }

function NotifIcon({ type, actorName, actorAvatar }) {
  const badgeStyle = {
    post_liked:      { bg: 'oklch(0.46 0.15 143)', icon: <ThumbsUp className="h-3 w-3 text-white fill-white" /> },
    friend_request:  { bg: 'linear-gradient(135deg,#8B5CF6,#a78bfa)', icon: <UserPlus className="h-3 w-3 text-white" /> },
    friend_accepted: { bg: 'linear-gradient(135deg,#10b981,#34d399)', icon: <Users className="h-3 w-3 text-white" /> },
    post_commented:  { bg: 'linear-gradient(135deg,#25c267,#4ade80)', icon: <MessageCircle className="h-3 w-3 text-white" /> },
  }
  const badge = badgeStyle[type] ?? badgeStyle.post_commented

  return (
    <div className="relative shrink-0">
      {actorAvatar ? (
        <img src={assetUrl(actorAvatar)} alt={actorName} className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: 'linear-gradient(135deg,#8B5CF6,#a78bfa)' }}>
          {actorName?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#242526]" style={{ background: badge.bg }}>
        {badge.icon}
      </div>
    </div>
  )
}

function ActorLink({ data }) {
  const to = data.actor_uuid ? `/users/${data.actor_uuid}` : '#'
  return (
    <Link
      to={to}
      onClick={(e) => e.stopPropagation()}
      className="font-bold hover:underline"
    >
      {data.actor_name}
    </Link>
  )
}

function notifText(data) {
  if (data.type === 'post_liked') {
    const emoji = REACTION_EMOJIS[data.reaction] ?? '👍'
    return <><ActorLink data={data} /> reacted {emoji} to your post{data.post_excerpt ? `: "${data.post_excerpt}"` : ''}</>
  }
  if (data.type === 'friend_request') {
    return <><ActorLink data={data} /> sent you a friend request</>
  }
  if (data.type === 'friend_accepted') {
    return <><ActorLink data={data} /> accepted your friend request</>
  }
  return <><ActorLink data={data} /> commented on your post{data.comment_excerpt ? `: "${data.comment_excerpt}"` : ''}</>
}

function FriendRequestActions({ notif, onResolve }) {
  const queryClient = useQueryClient()

  // Use the status from the backend (survives refresh), fall back to local optimistic state
  const serverStatus = notif.data.friend_request_status
  const isAlreadyHandled = serverStatus === 'accepted' || serverStatus === 'declined' || serverStatus === 'cancelled'

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
    onError: () => updateStatus('cancelled'),
  })

  if (isAlreadyHandled) {
    if (serverStatus === 'cancelled') return (
      <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500 mt-1 block">Request cancelled</span>
    )
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
        style={{ background: 'oklch(0.46 0.15 143)' }}
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
  const navigate = useNavigate()
  const unreadBg = 'oklch(0.46 0.15 143 / 0.05)'
  const isFriendRequest = notif.data.type === 'friend_request'

  const sharedClass = `flex items-start gap-4 px-5 py-4 transition-colors duration-150 cursor-pointer ${
    notif.read_at
      ? 'hover:bg-gray-50 dark:hover:bg-white/5'
      : 'hover:bg-primary/10 dark:hover:bg-primary/20'
  }`
  const sharedStyle = !notif.read_at ? { background: unreadBg } : {}

  const inner = (
    <>
      <div className="shrink-0">
        <NotifIcon type={notif.data.type} actorName={notif.data.actor_name} actorAvatar={notif.data.actor_avatar} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-snug">
          {notifText(notif.data)}
        </p>
        {isFriendRequest && (
          <FriendRequestActions notif={notif} onResolve={onResolve} />
        )}
        <p className="text-[12px] text-primary font-medium mt-1.5">
          {formatDistanceToNow(notif.created_at)}
        </p>
      </div>
      {!notif.read_at && (
        <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-2" style={{ background: 'oklch(0.46 0.15 143)' }} />
      )}
    </>
  )

  const handleClick = (e) => {
    if (e.target.closest('button')) return
    onMarkRead(notif.id)
    if (notif.data.actor_uuid) navigate(`/users/${notif.data.actor_uuid}`)
  }

  return (
    <div onClick={handleClick} className={sharedClass} style={sharedStyle}>
      {inner}
    </div>
  )
}

export default function NotificationsPage() {
  const { dark } = useThemeStore()
  const queryClient = useQueryClient()
  const queryKey = ['notifications']
  const handleResolve = () => queryClient.invalidateQueries({ queryKey })

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
            className="cursor-pointer flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary/90 transition-colors disabled:opacity-50"
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
        <div className="divide-y divide-gray-100 dark:divide-white/10">
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
