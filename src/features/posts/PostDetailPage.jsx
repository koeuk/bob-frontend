import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPost } from '../../api/posts'
import { createComment, deleteComment, likeComment } from '../../api/comments'
import useAuthStore from '../../store/authStore'
import PostCard from '../../components/shared/PostCard'
import ReportModal from '../../components/shared/ReportModal'
import { Button } from '../../components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog'
import { Loader2, ArrowLeft, Trash2, Flag, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'
import { toast } from 'sonner'

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like',  color: '#1877F2' },
  { type: 'love',  emoji: '❤️', label: 'Love',  color: '#F33E58' },
  { type: 'haha',  emoji: '😂', label: 'Haha',  color: '#F7B125' },
  { type: 'wow',   emoji: '😮', label: 'Wow',   color: '#F7B125' },
  { type: 'sad',   emoji: '😢', label: 'Sad',   color: '#F7B125' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: '#E9710F' },
]

function CommentReactionPicker({ onReact, onMouseEnter, onMouseLeave }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div
      className="picker-reveal absolute bottom-full left-0 mb-1 flex items-end gap-1 rounded-full px-2.5 py-2 z-50"
      style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 6px 24px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {REACTIONS.map((r) => (
        <div key={r.type} className="relative flex flex-col items-center">
          {hovered === r.type && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-gray-900/90 text-white rounded-md px-1.5 py-0.5 whitespace-nowrap pointer-events-none fade-in">
              {r.label}
            </span>
          )}
          <button
            onMouseEnter={() => setHovered(r.type)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onReact(r.type)}
            className="cursor-pointer text-2xl leading-none transition-all duration-150 hover:scale-[1.4] hover:-translate-y-1.5 active:scale-110"
            style={{ filter: hovered === r.type ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))' : 'none' }}
          >
            {r.emoji}
          </button>
        </div>
      ))}
    </div>
  )
}

function UserAvatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  return (
    <div className={`${sz} rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function CommentItem({ comment, postUuid, queryKey }) {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const queryClient = useQueryClient()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const hoverTimer = useRef(null)
  const isOwner = user?.uuid === comment.user?.uuid

  const myReaction = comment.my_reaction
    ? REACTIONS.find((r) => r.type === comment.my_reaction) ?? null
    : null

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment.uuid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Comment deleted') },
  })

  const likeMutation = useMutation({
    mutationFn: (type) => likeComment(comment.uuid, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const replyMutation = useMutation({
    mutationFn: () => createComment(postUuid, { body: replyBody, parent_id: comment.id }),
    onSuccess: () => { setReplyBody(''); setReplyOpen(false); queryClient.invalidateQueries({ queryKey }) },
  })

  const openPicker = () => {
    if (!isAuthenticated) return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPickerOpen(true), 450)
  }

  const closePicker = () => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPickerOpen(false), 180)
  }

  const cancelClose = () => clearTimeout(hoverTimer.current)

  const handleLike = () => {
    if (!isAuthenticated) return
    setPickerOpen(false)
    likeMutation.mutate(myReaction ? null : 'like')
  }

  const handleReact = (type) => {
    setPickerOpen(false)
    likeMutation.mutate(type)
  }

  const isLiked = myReaction || comment.liked_by_me

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <UserAvatar name={comment.user?.name} size="sm" />
        <div className="flex-1">
          {/* Comment bubble */}
          <div className="bg-[#F0F2F5] rounded-2xl px-3 py-2 inline-block max-w-full">
            <p className="font-semibold text-[13px] leading-tight">{comment.user?.name}</p>
            <p className="text-[15px] whitespace-pre-wrap mt-0.5">{comment.body}</p>
          </div>

          {/* Actions below bubble */}
          <div className="flex items-center gap-3 mt-1 ml-3 text-[12px] font-semibold text-gray-500">
            <span className="text-gray-400">{formatDistanceToNow(comment.created_at)}</span>

            {/* Like with reaction picker */}
            <div
              className="relative"
              onMouseEnter={openPicker}
              onMouseLeave={closePicker}
            >
              {pickerOpen && (
                <CommentReactionPicker onReact={handleReact} onMouseEnter={cancelClose} onMouseLeave={closePicker} />
              )}
              <button
                onClick={handleLike}
                className="cursor-pointer hover:underline transition-colors"
                style={isLiked ? { color: myReaction?.color ?? '#1877F2' } : {}}
              >
                {myReaction ? `${myReaction.emoji} ${myReaction.label}` : 'Like'}
              </button>
            </div>

            {isAuthenticated && (
              <button className="cursor-pointer hover:underline hover:text-gray-700 transition-colors" onClick={() => setReplyOpen(!replyOpen)}>
                Reply
              </button>
            )}
            {comment.likes_count > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500 font-normal">
                {myReaction ? (
                  <span className="text-[14px] leading-none">{myReaction.emoji}</span>
                ) : (
                  <div className="h-[16px] w-[16px] rounded-full bg-[#1877F2] flex items-center justify-center">
                    <ThumbsUp className="h-2 w-2 text-white fill-white" />
                  </div>
                )}
                <span>{comment.likes_count}</span>
              </div>
            )}
            <div className="ml-auto flex gap-1">
              {isOwner && (
                <button className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => deleteMutation.mutate()}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {!isOwner && isAuthenticated && (
                <button className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setReportOpen(true)}>
                  <Flag className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Reply form */}
          {replyOpen && (
            <div className="mt-2 flex gap-2 items-start">
              <UserAvatar name={user?.name} size="sm" />
              <div className="flex-1">
                <input
                  autoFocus
                  className="w-full bg-[#F0F2F5] rounded-full px-4 py-2 text-[15px] outline-none placeholder:text-gray-400"
                  placeholder="Write a reply…"
                  value={replyBody}
                  maxLength={5000}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && replyBody.trim()) {
                      e.preventDefault()
                      replyMutation.mutate()
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-10 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.uuid} comment={reply} postUuid={postUuid} queryKey={queryKey} />
          ))}
        </div>
      )}

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} type="comment" id={comment.uuid} />
    </div>
  )
}

export default function PostDetailPage() {
  const { uuid } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const queryKey = ['post', uuid]
  const [commentBody, setCommentBody] = useState('')

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getPost(uuid).then((r) => r.data),
  })

  const commentMutation = useMutation({
    mutationFn: () => createComment(uuid, { body: commentBody }),
    onSuccess: () => { setCommentBody(''); queryClient.invalidateQueries({ queryKey }) },
  })

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
    </div>
  )
  if (!data) return null

  const { post, comments } = data

  return (
    <div className="space-y-3">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium bg-white rounded-lg shadow px-4 py-2.5 w-full transition-colors hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </button>

      <PostCard post={post} queryKey={queryKey} />

      {/* Comments section */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <p className="font-semibold text-[15px]">
          {comments?.length ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
        </p>

        {/* Comment input */}
        {isAuthenticated ? (
          <div className="flex gap-2 items-start">
            <UserAvatar name={user?.name} size="sm" />
            <div className="flex-1 flex items-center gap-2 bg-[#F0F2F5] rounded-full px-4 py-2">
              <input
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
                placeholder="Write a comment…"
                value={commentBody}
                maxLength={5000}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && commentBody.trim()) {
                    e.preventDefault()
                    commentMutation.mutate()
                  }
                }}
              />
              {commentBody.trim() && (
                <button
                  onClick={() => commentMutation.mutate()}
                  disabled={commentMutation.isPending}
                  className="text-[#1877F2] font-semibold text-sm hover:text-[#166FE5] disabled:opacity-50"
                >
                  {commentMutation.isPending ? '…' : 'Post'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[15px] text-gray-500 text-center py-1">
            <Link to="/login" className="text-[#1877F2] font-semibold hover:underline">Sign in</Link> to leave a comment.
          </p>
        )}

        {/* Comment list */}
        {comments?.length > 0 && (
          <div className="space-y-4 pt-2">
            {comments.map((comment) => (
              <CommentItem key={comment.uuid} comment={comment} postUuid={uuid} queryKey={queryKey} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
