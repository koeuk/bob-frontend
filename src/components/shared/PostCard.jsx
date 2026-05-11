import { useState } from 'react'
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

function UserAvatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  return (
    <div className={`${sz} rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function PostCard({ post, queryKey }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
    likeMutation.mutate(post.liked_by_me ? null : 'like')
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
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[15px] font-semibold transition-colors hover:bg-gray-100 ${
              post.liked_by_me ? 'text-[#1877F2]' : 'text-gray-600'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 ${post.liked_by_me ? 'fill-[#1877F2] text-[#1877F2]' : ''}`} />
            Like
          </button>
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
