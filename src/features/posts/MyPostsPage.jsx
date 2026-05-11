import { useInfiniteQuery } from '@tanstack/react-query'
import { getMyPosts } from '../../api/posts'
import PostCard from '../../components/shared/PostCard'
import { Button } from '../../components/ui/button'
import { Loader2 } from 'lucide-react'

export default function MyPostsPage() {
  const queryKey = ['my-posts']

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getMyPosts(pageParam).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
  })

  const posts = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Posts</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No posts yet.</p>
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
