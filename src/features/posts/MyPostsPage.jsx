import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyPosts } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import PostCard from '../../components/shared/PostCard'
import CreatePostModal from '../../components/shared/CreatePostModal'
import { Button } from '../../components/ui/button'
import { Loader2, PenLine } from 'lucide-react'

const queryKey = ['my-posts']

export default function MyPostsPage() {
  const { user } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getMyPosts().then((r) => r.data),
  })

  const posts = data ?? []

  return (
    <div className="space-y-3">
      {/* Header card */}
      <div
        className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-4 flex items-center justify-between gap-4"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">My Posts</h1>
          {!isLoading && (
            <p className="text-[13px] text-gray-400 mt-0.5">
              {posts.length === 0 ? 'No posts yet' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer rounded-full text-[14px] font-semibold shrink-0"
          style={{ background: 'oklch(0.46 0.15 143)', boxShadow: '0 2px 8px oklch(0.46 0.15 143 / 0.3)' }}
        >
          <PenLine className="h-4 w-4 mr-1.5" />
          New post
        </Button>
      </div>

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} queryKey={queryKey} />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-12 text-center space-y-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
        >
          <div className="text-5xl">✍️</div>
          <div>
            <p className="font-semibold text-gray-700">Nothing here yet</p>
            <p className="text-[14px] text-gray-400 mt-1">Share what's on your mind, {user?.name?.split(' ')[0]}.</p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="cursor-pointer rounded-full"
            style={{ background: 'oklch(0.46 0.15 143)' }}
          >
            Create your first post
          </Button>
        </div>
      )}

      {posts.map((post, i) => (
        <div key={post.uuid} style={{ animationDelay: `${i * 40}ms` }}>
          <PostCard post={post} queryKey={queryKey} />
        </div>
      ))}
    </div>
  )
}
