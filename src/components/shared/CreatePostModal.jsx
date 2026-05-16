import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { ImageIcon, Smile, X, Globe, Lock } from 'lucide-react'
import { assetUrl } from '../../lib/utils'

const FEELINGS = [
  { value: 'happy',     emoji: '😊' },
  { value: 'loved',     emoji: '🥰' },
  { value: 'excited',   emoji: '🤩' },
  { value: 'blessed',   emoji: '🙏' },
  { value: 'thankful',  emoji: '🫶' },
  { value: 'cool',      emoji: '😎' },
  { value: 'tired',     emoji: '😴' },
  { value: 'sad',       emoji: '😢' },
  { value: 'angry',     emoji: '😡' },
  { value: 'sick',      emoji: '🤒' },
  { value: 'motivated', emoji: '💪' },
  { value: 'in love',   emoji: '❤️' },
]

export default function CreatePostModal({ open, onClose, queryKey }) {
  const { user } = useAuthStore()
  const { dark } = useThemeStore()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [images, setImages] = useState([])
  const [feeling, setFeeling] = useState(null)
  const [visibility, setVisibility] = useState('public')
  const [showFeelings, setShowFeelings] = useState(false)
  const fileRef = useRef(null)

  const createMutation = useMutation({
    mutationFn: () => createPost({ body, images: images.map((i) => i.file), feeling: feeling?.value, visibility }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); handleClose() },
  })

  const handleClose = () => {
    setBody(''); setImages([]); setFeeling(null)
    setVisibility('public'); setShowFeelings(false); onClose()
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files ?? [])
    const newItems = files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...newItems].slice(0, 10))
    e.target.value = ''
  }

  const canPost = (body.trim() || images.length > 0) && !createMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="w-[calc(100%-24px)] sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0"
        style={{ boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <DialogHeader className={`px-5 pt-5 pb-4 border-b relative ${dark ? 'border-white/10' : 'border-gray-100'}`}>
          <DialogTitle className={`text-center text-[17px] font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
            Create post
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'min(65vh, 520px)' }}>
          {/* Author row */}
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={assetUrl(user.avatar)} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 2px 8px rgba(24,119,242,0.28)' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className={`font-semibold text-[15px] leading-tight ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{user?.name}</p>
              <button
                onClick={() => setVisibility((v) => v === 'public' ? 'private' : 'public')}
                className={`cursor-pointer flex items-center gap-1 mt-1 rounded-lg px-2.5 py-1 w-fit transition-colors duration-200 ${dark ? 'bg-white/10 hover:bg-white/15 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                {visibility === 'public'
                  ? <><Globe className="h-3 w-3" /><span className="text-[12px] font-semibold">Public</span></>
                  : <><Lock className="h-3 w-3" /><span className="text-[12px] font-semibold">Only me</span></>
                }
              </button>
            </div>
          </div>

          {/* Compose area */}
          <textarea
            autoFocus
            className={`w-full resize-none outline-none text-[18px] min-h-[100px] leading-relaxed bg-transparent ${dark ? 'text-gray-100 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-300'}`}
            placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
            value={body}
            maxLength={10000}
            onChange={(e) => setBody(e.target.value)}
          />

          {/* Feeling tag */}
          {feeling && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 fade-in"
              style={{ background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.15)' }}
            >
              <span className="text-lg leading-none">{feeling.emoji}</span>
              <span className="text-[13px] font-medium text-[#1877F2]">feeling {feeling.value}</span>
              <button onClick={() => setFeeling(null)} className="cursor-pointer ml-0.5 text-[#1877F2]/60 hover:text-[#1877F2] transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Image preview grid */}
          {images.length > 0 && (
            <div className={`grid gap-1.5 fade-in ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {images.map((img, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-square" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="cursor-pointer absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button
                  onClick={() => fileRef.current.click()}
                  className={`cursor-pointer aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 ${dark ? 'border-white/20 text-gray-500 hover:border-white/30 hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-[12px] font-medium">Add more</span>
                </button>
              )}
            </div>
          )}

          {/* Feeling grid */}
          {showFeelings && (
            <div
              className="rounded-2xl p-3.5 scale-in"
              style={{ background: dark ? 'rgba(255,255,255,0.05)' : '#fafafa', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}
            >
              <p className={`text-[13px] font-semibold mb-3 uppercase tracking-wide ${dark ? 'text-gray-500' : 'text-gray-500'}`}>How are you feeling?</p>
              <div className="grid grid-cols-4 gap-1.5">
                {FEELINGS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setFeeling(f); setShowFeelings(false) }}
                    className={`cursor-pointer flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150 text-center hover:scale-105 ${
                      feeling?.value === f.value
                        ? 'ring-2 ring-[#1877F2]'
                        : dark ? 'hover:bg-white/8' : 'hover:bg-white'
                    }`}
                    style={feeling?.value === f.value ? { background: 'rgba(24,119,242,0.10)' } : {}}
                  >
                    <span className="text-2xl leading-none">{f.emoji}</span>
                    <span className={`text-[11px] capitalize leading-tight font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 space-y-3">
          <div
            className="flex items-center justify-between rounded-xl px-4 py-2.5"
            style={{
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              background: dark ? 'rgba(255,255,255,0.04)' : '#fafafa',
            }}
          >
            <span className={`text-[14px] font-semibold ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Add to your post</span>
            <div className="flex items-center gap-0.5">
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              <button
                onClick={() => fileRef.current.click()}
                title="Photo"
                className={`cursor-pointer h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
              >
                <ImageIcon className="h-5 w-5 text-green-500" />
              </button>
              <button
                onClick={() => setShowFeelings(!showFeelings)}
                title="Feeling"
                className={`cursor-pointer h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                  showFeelings
                    ? dark ? 'bg-yellow-900/30 ring-1 ring-yellow-500/30' : 'bg-yellow-50 ring-1 ring-yellow-200'
                    : dark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                }`}
              >
                <Smile className="h-5 w-5 text-yellow-400" />
              </button>
            </div>
          </div>

          <Button
            className="w-full rounded-xl text-[15px] font-semibold h-10 cursor-pointer transition-all duration-200"
            style={canPost
              ? { background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 4px 14px rgba(24,119,242,0.35)' }
              : {}
            }
            disabled={!canPost}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Posting…' : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
