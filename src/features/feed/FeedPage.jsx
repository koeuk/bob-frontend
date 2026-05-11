import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import PostCard from '../../components/shared/PostCard'
import CreatePostModal from '../../components/shared/CreatePostModal'
import { Button } from '../../components/ui/button'
import { Loader2, ImageIcon, Smile } from 'lucide-react'

export default function FeedPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const seed = useRef(Math.floor(Math.random() * 999999) + 1).current
  const queryKey = ['feed', seed]

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getFeed(pageParam, seed).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
    retry: false,
  })

  const posts = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="space-y-3">
      {/* Create post trigger */}
      {isAuthenticated ? (
        <div
          className="scale-in bg-white rounded-2xl p-4 space-y-3"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 6px rgba(24,119,242,0.25)' }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex-1 bg-gray-100/80 hover:bg-gray-100 rounded-full px-4 py-2.5 text-left text-gray-400 text-[15px] transition-all duration-200 hover:shadow-inner"
            >
              What's on your mind, {user?.name?.split(' ')[0]}?
            </button>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex">
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-100 text-[14px] font-semibold text-gray-500 transition-all duration-200 hover:text-gray-700"
            >
              <ImageIcon className="h-5 w-5 text-green-500" />
              Photo
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-100 text-[14px] font-semibold text-gray-500 transition-all duration-200 hover:text-gray-700"
            >
              <Smile className="h-5 w-5 text-yellow-400" />
              Feeling
            </button>
          </div>
        </div>
      ) : (
        <div
          className="scale-in bg-white rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <p className="text-[15px] text-gray-500">Sign in to share what's on your mind.</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="rounded-full bg-[#1877F2] hover:bg-[#166FE5]" asChild>
              <Link to="/register">Join</Link>
            </Button>
          </div>
        </div>
      )}

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} queryKey={queryKey} />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
        </div>
      )}

      {isError && !isAuthenticated && (
        <div
          className="scale-in bg-white rounded-2xl p-10 text-center space-y-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-500">Sign in to view posts from the community.</p>
          <Button className="rounded-full bg-[#1877F2] hover:bg-[#166FE5]" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {posts.map((post, i) => (
        <div key={post.uuid} style={{ animationDelay: `${i * 40}ms` }}>
          <PostCard post={post} queryKey={queryKey} />
        </div>
      ))}

      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full rounded-full bg-white hover:bg-gray-50 text-gray-600 font-semibold transition-all duration-200"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'See more posts'}
        </Button>
      )}
    </div>
  )
}
