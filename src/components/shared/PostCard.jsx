import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Trash2, Flag, MessageCircle, ThumbsUp, Globe } from 'lucide-react'
import { likePost, deletePost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import ReportModal from './ReportModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../lib/utils'

export function UserAvatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  return (
    <div className={`${sz} rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold shrink-0`}>
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

function ReactionPicker({ onReact }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div className="absolute bottom-full left-0 mb-2 flex items-end gap-1 bg-white rounded-full shadow-xl border border-gray-200 px-3 py-2 z-20">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          title={r.label}
          onMouseEnter={() => setHovered(r.type)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onReact(r.type)}
          className="flex flex-col items-center transition-all duration-150"
          style={{ transform: hovered === r.type ? 'scale(1.4) translateY(-6px)' : 'scale(1)' }}
        >
          <span className="text-2xl leading-none">{r.emoji}</span>
          {hovered === r.type && (
            <span className="text-[10px] font-semibold mt-1 bg-gray-800 text-white rounded px-1.5 py-0.5 absolute -top-7 whitespace-nowrap">
              {r.label}
            </span>
          )}
        </button>
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
    likeMutation.mutate(post.liked_by_me ? null : 'like')
  }

  const handleReact = (type) => {
    if (!isAuthenticated) return requireAuth()
    setPickerOpen(false)
    likeMutation.mutate(type)
  }

  const openPicker = () => {
    if (!isAuthenticated) return
    hoverTimer.current = setTimeout(() => setPickerOpen(true), 500)
  }

  const closePicker = () => {
    clearTimeout(hoverTimer.current)
    setPickerOpen(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <UserAvatar name={post.user?.name} />
            <div>
              <p className="font-semibold text-[15px] leading-tight">{post.user?.name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{formatDistanceToNow(post.created_at)}</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete post
                </DropdownMenuItem>
              )}
              {!isOwner && (
                <DropdownMenuItem onClick={() => isAuthenticated ? setReportOpen(true) : requireAuth()}>
                  <Flag className="h-4 w-4 mr-2" /> Report post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body */}
        <Link to={`/posts/${post.uuid}`}>
          <p className="px-4 pb-3 text-[15px] leading-5 whitespace-pre-wrap hover:opacity-80 transition-opacity">
            {post.body}
          </p>
        </Link>

        {/* Engagement stats */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <div className="flex items-center justify-between px-4 py-1.5 text-[13px] text-gray-500">
            {post.likes_count > 0 ? (
              <div className="flex items-center gap-1">
                <div className="h-[18px] w-[18px] rounded-full bg-[#1877F2] flex items-center justify-center">
                  <ThumbsUp className="h-2.5 w-2.5 text-white fill-white" />
                </div>
                <span>{post.likes_count}</span>
              </div>
            ) : <span />}
            {post.comments_count > 0 && (
              <Link to={`/posts/${post.uuid}`} className="hover:underline ml-auto">
                {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-gray-200" />

        {/* Action buttons */}
        <div className="flex mx-2 pb-1 pt-1 gap-1">
          {/* Like with reaction picker */}
          <div
            className="flex-1 relative"
            onMouseEnter={openPicker}
            onMouseLeave={closePicker}
          >
            {pickerOpen && <ReactionPicker onReact={handleReact} />}
            <button
              onClick={handleLike}
              className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[15px] font-semibold transition-colors hover:bg-gray-100 ${
                post.liked_by_me ? 'text-[#1877F2]' : 'text-gray-600'
              }`}
            >
              <ThumbsUp className={`h-5 w-5 ${post.liked_by_me ? 'fill-[#1877F2] text-[#1877F2]' : ''}`} />
              Like
            </button>
          </div>

          <Link
            to={`/posts/${post.uuid}`}
            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[15px] font-semibold text-gray-600 transition-colors hover:bg-gray-100"
          >
            <MessageCircle className="h-5 w-5" />
            Comment
          </Link>
        </div>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} type="post" id={post.uuid} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
