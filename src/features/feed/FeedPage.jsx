import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFeed, createPost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import PostCard from '../../components/shared/PostCard'
import { Button } from '../../components/ui/button'
import { Loader2, ImageIcon, Smile, X } from 'lucide-react'

const FEELINGS = [
  { value: 'happy',      emoji: '😊' },
  { value: 'loved',      emoji: '🥰' },
  { value: 'excited',    emoji: '🤩' },
  { value: 'blessed',    emoji: '🙏' },
  { value: 'thankful',   emoji: '🫶' },
  { value: 'cool',       emoji: '😎' },
  { value: 'tired',      emoji: '😴' },
  { value: 'sad',        emoji: '😢' },
  { value: 'angry',      emoji: '😡' },
  { value: 'sick',       emoji: '🤒' },
  { value: 'motivated',  emoji: '💪' },
  { value: 'in love',    emoji: '❤️' },
]

export default function FeedPage() {
  const [body, setBody] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [image, setImage] = useState(null)       // File object
  const [imagePreview, setImagePreview] = useState(null)
  const [feeling, setFeeling] = useState(null)
  const [feelingOpen, setFeelingOpen] = useState(false)
  const fileRef = useRef(null)
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
    mutationFn: () => createPost({ body, image, feeling: feeling?.value }),
    onSuccess: () => {
      setBody('')
      setExpanded(false)
      setImage(null)
      setImagePreview(null)
      setFeeling(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setExpanded(true)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    fileRef.current.value = ''
  }

  const removeFeeling = () => setFeeling(null)

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
                className="cursor-pointer flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-full px-4 py-2.5 text-left text-gray-500 text-[15px] transition-colors"
              >
                What's on your mind, {user?.name?.split(' ')[0]}?
              </button>
            ) : (
              <div className="flex-1">
                <textarea
                  autoFocus
                  className="w-full bg-transparent text-[15px] resize-none outline-none placeholder:text-gray-400 min-h-[80px]"
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                  value={body}
                  maxLength={10000}
                  onChange={(e) => setBody(e.target.value)}
                />
                {/* Feeling tag */}
                {feeling && (
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-[#1877F2] text-sm font-medium rounded-full px-3 py-1 mt-1">
                    <span>{feeling.emoji}</span>
                    <span>feeling {feeling.value}</span>
                    <button onClick={removeFeeling} className="cursor-pointer ml-1 hover:text-blue-800">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-cover" />
              <button
                onClick={removeImage}
                className="cursor-pointer absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Feeling picker dropdown */}
          {feelingOpen && (
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">How are you feeling?</p>
              <div className="grid grid-cols-4 gap-2">
                {FEELINGS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setFeeling(f); setFeelingOpen(false); setExpanded(true) }}
                    className={`cursor-pointer flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors text-center ${feeling?.value === f.value ? 'bg-blue-50 ring-1 ring-[#1877F2]' : ''}`}
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-xs text-gray-600 capitalize">{f.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {expanded && (
            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  onClick={() => fileRef.current.click()}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
                >
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <span className="hidden sm:inline">Photo</span>
                </button>
                <button
                  onClick={() => setFeelingOpen(!feelingOpen)}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors ${feelingOpen ? 'bg-gray-100 text-[#1877F2]' : 'text-gray-600'}`}
                >
                  <Smile className="h-5 w-5 text-yellow-400" />
                  <span className="hidden sm:inline">Feeling</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setExpanded(false); setBody(''); setImage(null); setImagePreview(null); setFeeling(null); setFeelingOpen(false) }}
                  className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                >
                  Cancel
                </button>
                <Button
                  size="sm"
                  className="cursor-pointer rounded-lg bg-[#1877F2] hover:bg-[#166FE5] px-4"
                  disabled={(!body.trim() && !image) || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </div>
          )}

          {/* Collapsed toolbar */}
          {!expanded && (
            <div className="border-t border-gray-200 pt-2 flex items-center gap-1">
              <button
                onClick={() => { fileRef.current.click() }}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
              >
                <ImageIcon className="h-5 w-5 text-green-500" /> Photo
              </button>
              <button
                onClick={() => { setExpanded(true); setFeelingOpen(true) }}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
              >
                <Smile className="h-5 w-5 text-yellow-400" /> Feeling
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
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

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
        </div>
      )}

      {isError && !isAuthenticated && (
        <div className="bg-white rounded-lg shadow p-8 text-center space-y-3">
          <p className="text-gray-500">Sign in to view posts from the community.</p>
          <Button className="bg-[#1877F2] hover:bg-[#166FE5]" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.uuid} post={post} queryKey={queryKey} />
      ))}

      {hasNextPage && (
        <Button variant="outline" className="w-full bg-white" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'See more posts'}
        </Button>
      )}
    </div>
  )
}
