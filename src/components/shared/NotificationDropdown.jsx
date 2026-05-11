import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markRead, markAllRead } from '../../api/notifications'
import { Bell, ThumbsUp, MessageCircle, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'

const REACTION_EMOJIS = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡' }

function NotifIcon({ type }) {
  if (type === 'post_liked') return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#1877F2,#4facfe)' }}>
      <ThumbsUp className="h-4 w-4 text-white fill-white" />
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
  return <><strong>{data.actor_name}</strong> commented on your post{data.comment_excerpt ? `: "${data.comment_excerpt}"` : ''}</>
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
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
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
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

  const handleNotifClick = (notif) => {
    if (!notif.read_at) markReadMutation.mutate(notif.id)
    setOpen(false)
  }

  return (
    <>
      {/* Bell button */}
      <button
        ref={btnRef}
        title="Notifications"
        onClick={handleOpen}
        className="cursor-pointer relative h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105 shrink-0"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full text-white text-[11px] font-bold flex items-center justify-center px-1 leading-none"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel — portalled to body to escape backdrop-filter containing block */}
      {open && createPortal(
        <div
          ref={panelRef}
          className="scale-in fixed w-[360px] rounded-2xl overflow-hidden z-[9999]"
          style={{
            top: pos.top,
            right: pos.right,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            background: 'white',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-[17px] text-gray-900">Notifications</h3>
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

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <Bell className="h-10 w-10 opacity-30" />
                <p className="text-[14px] font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  to={`/posts/${notif.data.post_uuid}`}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 ${
                    notif.read_at ? 'hover:bg-gray-50' : 'hover:bg-blue-50/60'
                  }`}
                  style={!notif.read_at ? { background: 'rgba(24,119,242,0.05)' } : {}}
                >
                  <NotifIcon type={notif.data.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-800 leading-snug line-clamp-2">
                      {notifText(notif.data)}
                    </p>
                    <p className="text-[12px] text-[#1877F2] font-medium mt-0.5">
                      {formatDistanceToNow(notif.created_at)}
                    </p>
                  </div>
                  {!notif.read_at && (
                    <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5" style={{ background: '#1877F2' }} />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
