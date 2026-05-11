import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFeed, createPost } from '../../api/posts'
import PostCard from '../../components/shared/PostCard'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent } from '../../components/ui/card'
import { Loader2 } from 'lucide-react'

export default function FeedPage() {
  const [body, setBody] = useState('')
  const queryClient = useQueryClient()
  const queryKey = ['feed']

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getFeed(pageParam).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
  })

  const createMutation = useMutation({
    mutationFn: () => createPost({ body }),
    onSuccess: () => {
      setBody('')
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const posts = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            rows={3}
            maxLength={10000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{body.length}/10000</span>
            <Button
              size="sm"
              disabled={!body.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.uuid} post={post} queryKey={queryKey} />
      ))}

      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
        </Button>
      )}
    </div>
  )
}
