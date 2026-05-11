import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Trash2, Flag, MessageCircle } from 'lucide-react'
import { likePost, deletePost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import ReactionPicker from './ReactionPicker'
import ReportModal from './ReportModal'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow } from '../../lib/utils'

export default function PostCard({ post, queryKey }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isOwner = user?.uuid === post.user?.uuid

  const requireAuth = () => {
    toast('Sign in to interact', { action: { label: 'Sign in', onClick: () => navigate('/login') } })
    return false
  }

  const likeMutation = useMutation({
    mutationFn: (type) => likePost(post.uuid, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(post.uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Post deleted')
    },
  })

  return (
    <>
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{post.user?.name}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(post.created_at)}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <DropdownMenuItem onClick={() => isAuthenticated ? setReportOpen(true) : requireAuth()}>
                    <Flag className="h-4 w-4 mr-2" /> Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link to={`/posts/${post.uuid}`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed hover:opacity-80 transition-opacity">
              {post.body}
            </p>
          </Link>

          <div className="flex items-center gap-1 pt-1 border-t">
            <ReactionPicker
              liked={post.liked_by_me}
              count={post.likes_count}
              onReact={(type) => isAuthenticated ? likeMutation.mutate(type) : requireAuth()}
            />
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
              <Link to={`/posts/${post.uuid}`}>
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count ?? ''}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
