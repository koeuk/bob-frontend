import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPost } from '../../api/posts'
import { createComment, deleteComment, likeComment } from '../../api/comments'
import useAuthStore from '../../store/authStore'
import PostCard from '../../components/shared/PostCard'
import ReactionPicker from '../../components/shared/ReactionPicker'
import ReportModal from '../../components/shared/ReportModal'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Loader2, ArrowLeft, Trash2, Flag, CornerDownRight } from 'lucide-react'
import { formatDistanceToNow } from '../../lib/utils'
import { toast } from 'sonner'

function CommentItem({ comment, postUuid, queryKey }) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const isOwner = user?.uuid === comment.user?.uuid

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

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold">{comment.user?.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(comment.created_at)}</span>
            </div>
            <div className="flex gap-1">
              {isOwner && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate()}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              {!isOwner && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReportOpen(true)}>
                  <Flag className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
          <div className="flex items-center gap-1">
            <ReactionPicker
              currentType={comment.user_reaction}
              count={comment.likes_count}
              onReact={(type) => likeMutation.mutate(type)}
            />
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setReplyOpen(!replyOpen)}>
              <CornerDownRight className="h-3 w-3 mr-1" /> Reply
            </Button>
          </div>
          {replyOpen && (
            <div className="space-y-2 mt-2">
              <Textarea
                placeholder="Write a reply…"
                rows={2}
                maxLength={5000}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setReplyOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!replyBody.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate()}>
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="ml-6 pl-4 border-l space-y-4">
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

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!data) return null

  const { post, comments } = data

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/feed"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
      </Button>

      <PostCard post={post} queryKey={queryKey} />

      <div className="space-y-2">
        <Textarea
          placeholder="Write a comment…"
          rows={3}
          maxLength={5000}
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!commentBody.trim() || commentMutation.isPending}
            onClick={() => commentMutation.mutate()}
          >
            {commentMutation.isPending ? 'Posting…' : 'Comment'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {comments?.map((comment) => (
          <CommentItem key={comment.uuid} comment={comment} postUuid={uuid} queryKey={queryKey} />
        ))}
      </div>
    </div>
  )
}
