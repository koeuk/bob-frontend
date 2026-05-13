import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const seed = useRef(Math.floor(Math.random() * 999999) + 1).current
  const queryKey = ['feed', seed, q]
  const sentinelRef = useRef(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getFeed(pageParam, seed, q).then((r) => r.data),
    getNextPageParam: (last) => last.current_page < last.last_page ? last.current_page + 1 : undefined,
  })

  const posts = data?.pages.flatMap((p) => p.data) ?? []

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="space-y-3">
      {/* Search result header */}
      {q && (
        <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 px-1">
          Results for <span className="text-gray-900 dark:text-gray-100">"{q}"</span>
          {!isLoading && ` — ${posts.length} post${posts.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Create post trigger */}
      {isAuthenticated ? (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-4 space-y-3"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 6px rgba(24,119,242,0.25)' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex-1 bg-gray-100/80 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 rounded-full px-4 py-2.5 text-left text-gray-400 dark:text-gray-500 text-[15px] transition-all duration-200 hover:shadow-inner"
            >
              What's on your mind, {user?.name?.split(' ')[0]}?
            </button>
          </div>
          <div className="h-px bg-gray-100 dark:bg-white/10" />
          <div className="flex">
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-[14px] font-semibold text-gray-500 dark:text-gray-400 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <ImageIcon className="h-5 w-5 text-green-500" />
              Photo
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-[14px] font-semibold text-gray-500 dark:text-gray-400 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Smile className="h-5 w-5 text-yellow-400" />
              Feeling
            </button>
          </div>
        </div>
      ) : (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <p className="text-[15px] text-gray-500 dark:text-gray-400">Sign in to share what's on your mind.</p>
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

      {isError && (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-10 text-center"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-500 dark:text-gray-400">Failed to load posts. Please try again.</p>
        </div>
      )}

      {posts.map((post, i) => (
        <div key={post.uuid} style={{ animationDelay: `${i * 40}ms` }}>
          <PostCard post={post} queryKey={queryKey} />
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-[#1877F2]" />}
      </div>
    </div>
  )
}
