import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFeed, createPost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import PostCard from '../../components/shared/PostCard'
import { Button } from '../../components/ui/button'
import { Loader2, ImageIcon, Smile } from 'lucide-react'

export default function FeedPage() {
  const [body, setBody] = useState('')
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()
  const queryKey = ['feed']
  const { user, isAuthenticated } = useAuthStore()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getFeed(pageParam).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: () => createPost({ body }),
    onSuccess: () => {
      setBody('')
      setExpanded(false)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const posts = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-3">
      {/* Create post card */}
      {isAuthenticated ? (
        <div className="bg-white rounded-lg shadow p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-full px-4 py-2.5 text-left text-gray-500 text-[15px] transition-colors"
              >
                What's on your mind, {user?.name?.split(' ')[0]}?
              </button>
            ) : (
              <textarea
                autoFocus
                className="flex-1 bg-transparent text-[15px] resize-none outline-none placeholder:text-gray-400 min-h-[80px]"
                placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                value={body}
                maxLength={10000}
                onChange={(e) => setBody(e.target.value)}
              />
            )}
          </div>

          {expanded && (
            <>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-gray-500">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                    <ImageIcon className="h-5 w-5 text-green-500" /> Photo
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                    <Smile className="h-5 w-5 text-yellow-400" /> Feeling
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setExpanded(false); setBody('') }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
                    Cancel
                  </button>
                  <Button
                    size="sm"
                    className="rounded-lg bg-[#1877F2] hover:bg-[#166FE5] px-4"
                    disabled={!body.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                  >
                    {createMutation.isPending ? 'Posting…' : 'Post'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
          <p className="text-[15px] text-gray-500">Sign in to share what's on your mind.</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            <Button size="sm" className="bg-[#1877F2] hover:bg-[#166FE5]" asChild><Link to="/register">Join</Link></Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
        </div>
      )}

      {/* Auth required to view posts */}
      {isError && !isAuthenticated && (
        <div className="bg-white rounded-lg shadow p-8 text-center space-y-3">
          <p className="text-gray-500">Sign in to view posts from the community.</p>
          <Button className="bg-[#1877F2] hover:bg-[#166FE5]" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post.uuid} post={post} queryKey={queryKey} />
      ))}

      {/* Load more */}
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full bg-white"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'See more posts'}
        </Button>
      )}
    </div>
  )
}
