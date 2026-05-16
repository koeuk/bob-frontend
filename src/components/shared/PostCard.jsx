import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Trash2, Flag, Pencil, MessageCircle, ThumbsUp, Globe, Lock, Share2, UserPlus, UserCheck, Clock, UserX } from 'lucide-react'
import { likePost, deletePost } from '../../api/posts'
import { sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest } from '../../api/friends'
import useAuthStore from '../../store/authStore'
import ReportModal from './ReportModal'
import EditPostModal from './EditPostModal'
import ImageLightbox from './ImageLightbox'
import ShareModal from './ShareModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow, assetUrl } from '../../lib/utils'

export function UserAvatar({ name, avatar, size = 'md', active = false }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  const dotSz = size === 'sm' ? 'h-2.5 w-2.5 border-[1.5px]' : 'h-3 w-3 border-2'
  const inner = avatar ? (
    <img src={assetUrl(avatar)} alt={name} className={`${sz} rounded-full object-cover shrink-0`} style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
  ) : (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 6px rgba(24,119,242,0.25)' }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
  if (!active) return inner
  return (
    <div className="relative shrink-0">
      {inner}
      <span className={`absolute bottom-0 right-0 ${dotSz} rounded-full border-white dark:border-[#242526]`} style={{ background: '#22c55e' }} />
    </div>
  )
}

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like',  color: '#1877F2' },
  { type: 'love',  emoji: '❤️', label: 'Love',  color: '#F33E58' },
  { type: 'haha',  emoji: '😂', label: 'Haha',  color: '#F7B125' },
  { type: 'wow',   emoji: '😮', label: 'Wow',   color: '#F7B125' },
  { type: 'sad',   emoji: '😢', label: 'Sad',   color: '#F7B125' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: '#E9710F' },
]

function ReactionIcons({ summary, myReaction }) {
  // Show distinct emoji types sorted by count (most reacted first), up to 3
  const icons = Object.entries(summary ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find(r => r.type === type))
    .filter(Boolean)

  if (icons.length > 0) {
    return (
      <div className="flex items-center">
        {icons.map((r, i) => (
          <span
            key={r.type}
            className="text-[17px] leading-none"
            style={{ marginLeft: i > 0 ? -4 : 0, zIndex: icons.length - i, position: 'relative' }}
          >
            {r.emoji}
          </span>
        ))}
      </div>
    )
  }

  // Fallback when no summary available
  if (myReaction) return <span className="text-[18px] leading-none">{myReaction.emoji}</span>
  return (
    <div
      className="h-[20px] w-[20px] rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 1px 4px rgba(24,119,242,0.3)' }}
    >
      <ThumbsUp className="h-2.5 w-2.5 text-white fill-white" />
    </div>
  )
}

function ReactionPicker({ onReact, onMouseEnter, onMouseLeave }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div
      className="picker-reveal absolute bottom-full left-0 mb-2 flex items-end gap-1.5 rounded-full px-3 py-2.5 z-50"
      style={{ background: document.documentElement.classList.contains('dark') ? 'rgba(50,51,54,0.98)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)', border: document.documentElement.classList.contains('dark') ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {REACTIONS.map((r, i) => (
        <div key={r.type} className="relative flex flex-col items-center" style={{ animationDelay: `${i * 28}ms` }}>
          {hovered === r.type && (
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-gray-900/90 text-white rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none fade-in" style={{ backdropFilter: 'blur(4px)' }}>
              {r.label}
            </span>
          )}
          <button
            onMouseEnter={() => setHovered(r.type)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onReact(r.type)}
            className="cursor-pointer text-3xl leading-none transition-all duration-150 hover:scale-[1.45] hover:-translate-y-2 active:scale-110"
            style={{ filter: hovered === r.type ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }}
          >
            {r.emoji}
          </button>
        </div>
      ))}
    </div>
  )
}

function PostImages({ images, onImageClick }) {
  if (!images.length) return null
  const count = images.length
  const show = images.slice(0, 4)
  const extra = count - 4

  const imgClass = 'w-full h-full object-cover cursor-pointer transition-opacity duration-150 hover:opacity-90'

  if (count === 1) {
    return (
      <div className="mt-1 px-3 overflow-hidden">
        <img
          src={assetUrl(show[0])}
          alt=""
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onImageClick(0) }}
          className="w-full max-h-[500px] object-cover cursor-pointer hover:opacity-90 transition-opacity duration-150 rounded-xl"
        />
      </div>
    )
  }

  return (
    <div className={`mt-1 px-3 grid gap-2 ${count === 2 ? 'grid-cols-2' : count === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {show.map((src, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl"
          style={{ aspectRatio: '1/1' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onImageClick(i) }}
        >
          <img src={assetUrl(src)} alt="" className={imgClass} />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
              <span className="text-white text-2xl font-bold">+{extra}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FriendButton({ friendshipStatus, authorUuid, queryKey }) {
  const queryClient = useQueryClient()
  const [localStatus, setLocalStatus] = useState(friendshipStatus)

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const sendMutation = useMutation({
    mutationFn: () => sendFriendRequest(authorUuid),
    onSuccess: (res) => { setLocalStatus({ status: 'pending_sent', request_id: res.data.id }); invalidate() },
    onError: (err) => {
      const data = err.response?.data
      if (err.response?.status === 422 && data?.status) {
        if (data.status === 'pending') setLocalStatus({ status: 'pending_sent', request_id: data.id })
        else if (data.status === 'accepted') setLocalStatus({ status: 'friends' })
        invalidate()
      } else {
        toast.error('Could not send friend request')
      }
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelFriendRequest(localStatus?.request_id),
    onSuccess: () => { setLocalStatus({ status: 'none' }); invalidate() },
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptFriendRequest(localStatus?.request_id),
    onSuccess: () => { setLocalStatus({ status: 'friends' }); invalidate() },
    onError: () => toast.error('Could not accept request'),
  })

  const declineMutation = useMutation({
    mutationFn: () => declineFriendRequest(localStatus?.request_id),
    onSuccess: () => { setLocalStatus({ status: 'none' }); invalidate() },
  })

  const status = localStatus?.status ?? 'none'

  if (status === 'friends') {
    return (
      <span className="flex items-center gap-1 text-[12px] font-semibold text-[#1877F2] px-2 py-1 rounded-full" style={{ background: 'rgba(24,119,242,0.08)' }}>
        <UserCheck className="h-3.5 w-3.5" />
        Friends
      </span>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={() => cancelMutation.mutate()}
        disabled={cancelMutation.isPending}
        className="cursor-pointer flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
        style={{ background: 'rgba(0,0,0,0.05)' }}
        title="Cancel friend request"
      >
        <Clock className="h-3.5 w-3.5" />
        Pending
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
          className="cursor-pointer flex items-center gap-1 text-[12px] font-semibold text-white px-2.5 py-1 rounded-full transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#1877F2,#4facfe)' }}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          onClick={() => declineMutation.mutate()}
          disabled={declineMutation.isPending}
          className="cursor-pointer flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-white/15"
          style={{ background: 'rgba(0,0,0,0.06)' }}
        >
          <UserX className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // status === 'none'
  return (
    <button
      onClick={() => sendMutation.mutate()}
      disabled={sendMutation.isPending}
      className="cursor-pointer flex items-center gap-1 text-[12px] font-semibold text-[#1877F2] px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
      style={{ border: '1.5px solid rgba(24,119,242,0.35)' }}
    >
      <UserPlus className="h-3.5 w-3.5" />
      Add
    </button>
  )
}

export default function PostCard({ post, queryKey }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const hoverTimer = useRef(null)
  const isOwner = user?.uuid === post.user?.uuid

  const myReaction = post.my_reaction
    ? REACTIONS.find((r) => r.type === post.my_reaction) ?? null
    : null

  const requireAuth = () => {
    toast('Sign in to interact', { action: { label: 'Sign in', onClick: () => navigate('/login') } })
  }

  const likeMutation = useMutation({
    mutationFn: (type) => likePost(post.uuid, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(post.uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Post deleted') },
  })

  const handleLike = () => {
    if (!isAuthenticated) return requireAuth()
    setPickerOpen(false)
    likeMutation.mutate(myReaction ? null : 'like')
  }

  const handleReact = (type) => {
    if (!isAuthenticated) return requireAuth()
    setPickerOpen(false)
    likeMutation.mutate(type)
  }

  const openPicker = () => {
    if (!isAuthenticated) return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPickerOpen(true), 450)
  }

  const closePicker = () => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPickerOpen(false), 180)
  }

  const cancelClose = () => { clearTimeout(hoverTimer.current) }

  const isLiked = myReaction || post.liked_by_me

  return (
    <>
      <div
        className="post-enter bg-white dark:bg-[#242526] rounded-2xl transition-shadow duration-300 overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)'}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Link to={`/users/${post.user?.uuid}`} onClick={(e) => e.stopPropagation()}>
              <UserAvatar name={post.user?.name} avatar={post.user?.avatar} active={isOwner} />
            </Link>
            <div>
              <Link
                to={`/users/${post.user?.uuid}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[15px] leading-tight text-gray-900 dark:text-gray-100 hover:underline"
              >
                {post.user?.name}
              </Link>
              {post.feeling && (
                <span className="font-normal text-[15px] text-gray-500"> — feeling {post.feeling}</span>
              )}
              <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-0.5">
                <span>{formatDistanceToNow(post.created_at)}</span>
                <span className="text-gray-300">·</span>
                {post.visibility === 'private'
                  ? <Lock className="h-3 w-3" />
                  : <Globe className="h-3 w-3" />
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && !isOwner && post.friendship_status && (
              <FriendButton
                friendshipStatus={post.friendship_status}
                authorUuid={post.user?.uuid}
                queryKey={queryKey}
              />
            )}
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 hover:scale-105 bg-transparent border-0 p-0 focus:outline-none">
              <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-gray-100">
              {isOwner && (
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit post
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem className="cursor-pointer text-destructive rounded-lg" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete post
                </DropdownMenuItem>
              )}
              {!isOwner && (
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => isAuthenticated ? setReportOpen(true) : requireAuth()}>
                  <Flag className="h-4 w-4 mr-2" /> Report post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {/* Body */}
        <Link to={`/posts/${post.uuid}`} className="block group">
          {post.feeling && (
            <p className="px-4 pt-1 text-[15px] text-gray-400">
              is feeling <span className="font-medium text-gray-600">{post.feeling}</span>
            </p>
          )}
          {post.body && (
            <p className="px-4 py-2 text-[15px] leading-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
              {post.body}
            </p>
          )}
        </Link>
        <PostImages
          images={post.images ?? (post.image ? [post.image] : [])}
          onImageClick={(i) => setLightboxIndex(i)}
        />

        {/* Shared post embed */}
        {post.shared_post && (
          <Link
            to={`/posts/${post.shared_post.uuid}`}
            className="block mx-3 mb-2 rounded-xl overflow-hidden transition-opacity duration-150 hover:opacity-90"
            style={{ border: '1px solid rgba(0,0,0,0.09)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
              <UserAvatar name={post.shared_post.user?.name} avatar={post.shared_post.user?.avatar} size="sm" />
              <div>
                <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{post.shared_post.user?.name}</span>
                <p className="text-[11px] text-gray-400">{formatDistanceToNow(post.shared_post.created_at)}</p>
              </div>
            </div>
            {post.shared_post.body && (
              <p className="px-3 pb-2 text-[13px] text-gray-600 dark:text-gray-300 line-clamp-4 whitespace-pre-wrap">
                {post.shared_post.body}
              </p>
            )}
            {(post.shared_post.images?.[0] || post.shared_post.image) && (
              <img
                src={assetUrl(post.shared_post.images?.[0] ?? post.shared_post.image)}
                alt=""
                className="w-full max-h-48 object-cover"
              />
            )}
          </Link>
        )}

        {/* Engagement stats */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <div className="flex items-center justify-between px-4 py-2 text-[13px] text-gray-400 dark:text-gray-500">
            {post.likes_count > 0 ? (
              <div className="flex items-center gap-1.5">
                <ReactionIcons summary={post.reactions_summary} myReaction={myReaction} />
                <span className="font-medium">{post.likes_count}</span>
              </div>
            ) : <span />}
            {post.comments_count > 0 && (
              <Link to={`/posts/${post.uuid}`} className="hover:text-gray-700 hover:underline transition-colors ml-auto">
                {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 h-px bg-gray-100 dark:bg-white/10" />

        {/* Action buttons */}
        <div className="flex mx-1 py-1 gap-0.5">
          {/* Like / Reaction */}
          <div
            className="flex-1 relative"
            onMouseEnter={openPicker}
            onMouseLeave={closePicker}
          >
            {pickerOpen && (
              <ReactionPicker onReact={handleReact} onMouseEnter={cancelClose} onMouseLeave={closePicker} />
            )}
            <button
              onClick={handleLike}
              className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold transition-all duration-200 hover:scale-[1.02]"
              style={isLiked
                ? { color: myReaction?.color ?? '#1877F2', background: `${myReaction?.color ?? '#1877F2'}12` }
                : { color: '#65676b' }
              }
              onMouseEnter={(e) => {
                if (!isLiked) e.currentTarget.style.background = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : '#f2f2f2'
              }}
              onMouseLeave={(e) => !isLiked && (e.currentTarget.style.background = 'transparent')}
            >
              {myReaction ? (
                <span className="text-xl leading-none">{myReaction.emoji}</span>
              ) : (
                <ThumbsUp className={`h-5 w-5 transition-transform duration-200 ${isLiked ? 'fill-current scale-110' : ''}`} />
              )}
              <span>{myReaction ? myReaction.label : 'Like'}</span>
            </button>
          </div>

          <Link
            to={`/posts/${post.uuid}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 hover:scale-[1.02]"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Comment{post.comments_count > 0 ? ` ${post.comments_count}` : ''}</span>
          </Link>

          <button
            onClick={() => setShareOpen(true)}
            className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 hover:scale-[1.02]"
          >
            <Share2 className="h-5 w-5" />
            <span>Share{post.shares_count > 0 ? ` ${post.shares_count}` : ''}</span>
          </button>
        </div>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} type="post" id={post.uuid} />
      <EditPostModal open={editOpen} onClose={() => setEditOpen(false)} post={post} queryKey={queryKey} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} feedQueryKey={queryKey} />
      {lightboxIndex !== null && (
        <ImageLightbox
          images={post.images ?? (post.image ? [post.image] : [])}
          index={lightboxIndex}
          onNavigate={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
