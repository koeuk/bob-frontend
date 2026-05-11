import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Trash2, Flag, MessageCircle, ThumbsUp, Globe, Lock, Share2 } from 'lucide-react'
import { likePost, deletePost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import ReportModal from './ReportModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow, assetUrl } from '../../lib/utils'

export function UserAvatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 6px rgba(24,119,242,0.25)' }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
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

function ReactionPicker({ onReact, onMouseEnter, onMouseLeave }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div
      className="picker-reveal absolute bottom-full left-0 mb-2 flex items-end gap-1.5 rounded-full px-3 py-2.5 z-50"
      style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}
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

function PostImages({ images }) {
  if (!images.length) return null
  const count = images.length
  const show = images.slice(0, 4)
  const extra = count - 4

  if (count === 1) {
    return (
      <div className="mt-1 overflow-hidden">
        <img src={assetUrl(show[0])} alt="" className="w-full max-h-[500px] object-cover transition-transform duration-500 group-hover:scale-[1.01]" />
      </div>
    )
  }

  return (
    <div className={`mt-1 grid gap-0.5 ${count === 2 ? 'grid-cols-2' : count === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {show.map((src, i) => (
        <div key={i} className={`relative overflow-hidden ${count === 3 && i === 0 ? 'col-span-1 row-span-1' : ''}`} style={{ aspectRatio: count === 2 ? '1/1' : count === 3 ? (i === 0 ? '1/1' : '1/1') : '1/1' }}>
          <img src={assetUrl(src)} alt="" className="w-full h-full object-cover" />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+{extra}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PostCard({ post, queryKey }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
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
        className="post-enter bg-white rounded-2xl transition-shadow duration-300 overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)'}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <UserAvatar name={post.user?.name} />
            <div>
              <p className="font-semibold text-[15px] leading-tight text-gray-900">
                {post.user?.name}
                {post.feeling && (
                  <span className="font-normal text-gray-500"> — feeling {post.feeling}</span>
                )}
              </p>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-gray-100">
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

        {/* Body */}
        <Link to={`/posts/${post.uuid}`} className="block group">
          {post.feeling && (
            <p className="px-4 pt-1 text-[15px] text-gray-400">
              is feeling <span className="font-medium text-gray-600">{post.feeling}</span>
            </p>
          )}
          {post.body && (
            <p className="px-4 py-2 text-[15px] leading-6 text-gray-800 whitespace-pre-wrap group-hover:text-gray-900 transition-colors duration-200">
              {post.body}
            </p>
          )}
          <PostImages images={post.images ?? (post.image ? [post.image] : [])} />
        </Link>

        {/* Engagement stats */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <div className="flex items-center justify-between px-4 py-2 text-[13px] text-gray-400">
            {post.likes_count > 0 ? (
              <div className="flex items-center gap-1.5">
                {myReaction ? (
                  <span className="text-[18px] leading-none">{myReaction.emoji}</span>
                ) : (
                  <div
                    className="h-[20px] w-[20px] rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 1px 4px rgba(24,119,242,0.3)' }}
                  >
                    <ThumbsUp className="h-2.5 w-2.5 text-white fill-white" />
                  </div>
                )}
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
        <div className="mx-4 h-px bg-gray-100" />

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
              onMouseEnter={(e) => !isLiked && (e.currentTarget.style.background = '#f2f2f2')}
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
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 hover:scale-[1.02]"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Comment</span>
          </Link>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.origin + `/posts/${post.uuid}`)
              toast.success('Link copied!')
            }}
            className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[14px] font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 hover:scale-[1.02]"
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} type="post" id={post.uuid} />

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
