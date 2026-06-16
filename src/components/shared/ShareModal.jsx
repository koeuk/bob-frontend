import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../../api/posts'
import useAuthStore from '../../store/authStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { assetUrl } from '../../lib/utils'

const PLATFORMS = [
  {
    id: 'facebook',
    label: 'Facebook',
    color: 'oklch(0.46 0.15 143)',
    bg: '#E7F0FD',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    bg: '#F0F0F0',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#E8F9EE',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.75.75 0 00.917.917l5.766-1.476A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.497-5.195-1.367l-.373-.214-3.865.99.99-3.865-.214-.373A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
    getUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#26A5E4',
    bg: '#E5F4FC',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    getUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
]

export default function ShareModal({ open, onClose, post, feedQueryKey }) {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [shareBody, setShareBody] = useState('')
  const [sharing, setSharing] = useState(false)

  const postUrl = window.location.origin + `/posts/${post?.uuid}`
  const postText = post?.body?.slice(0, 100) ?? ''

  const copyLink = () => {
    navigator.clipboard?.writeText(postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied!')
  }

  const openPlatform = (platform) => {
    window.open(platform.getUrl(postUrl, postText), '_blank', 'noopener,noreferrer')
  }

  const shareMutation = useMutation({
    mutationFn: () => createPost({
      body: shareBody.trim() || undefined,
      shared_post_id: post?.id,
      visibility: 'public',
    }),
    onSuccess: () => {
      if (feedQueryKey) queryClient.invalidateQueries({ queryKey: feedQueryKey })
      toast.success('Shared to your feed!')
      setShareBody('')
      onClose()
    },
    onError: () => toast.error('Failed to share'),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-sm p-0 gap-0 overflow-hidden rounded-2xl border-0"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <DialogTitle className="text-center text-[17px] font-bold text-gray-900">Share post</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Copy link */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
            style={{ background: copied ? '#E8F9EE' : '#f5f5f5' }}
            onClick={copyLink}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
              style={{ background: copied ? '#25D366' : '#e0e0e0' }}
            >
              {copied
                ? <Check className="h-5 w-5 text-white" />
                : <Copy className="h-5 w-5 text-gray-600" />
              }
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="font-semibold text-[14px] text-gray-900">{copied ? 'Link copied!' : 'Copy link'}</p>
              <p className="text-[12px] text-gray-400 break-all line-clamp-2">{postUrl}</p>
            </div>
          </div>

          {/* Platform buttons */}
          <div>
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Share to</p>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPlatform(p)}
                  className="cursor-pointer flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150 hover:scale-105"
                  style={{ background: p.bg }}
                >
                  <span style={{ color: p.color }}>{p.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Share to feed */}
          {isAuthenticated && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Share to your feed</p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              >
                {/* Mini compose */}
                <div className="flex items-start gap-2.5 p-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={user?.avatar ? {} : { background: 'oklch(0.46 0.15 143)' }}
                  >
                    {user?.avatar
                      ? <img src={assetUrl(user.avatar)} alt="" className="w-full h-full object-cover rounded-full" />
                      : user?.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <textarea
                    className="flex-1 resize-none outline-none text-[14px] placeholder:text-gray-300 min-h-[52px] leading-relaxed text-gray-800 bg-transparent"
                    placeholder="Say something about this..."
                    value={shareBody}
                    onChange={(e) => setShareBody(e.target.value)}
                  />
                </div>

                {/* Post preview */}
                <div
                  className="mx-3 mb-3 rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(0,0,0,0.09)' }}
                >
                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                    {post?.user?.avatar ? (
                      <img src={assetUrl(post.user.avatar)} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: 'oklch(0.46 0.15 143)' }}>
                        {post?.user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-[12px] font-semibold text-gray-700 truncate">{post?.user?.name}</span>
                  </div>
                  {post?.body && (
                    <p className="px-3 pb-2 text-[13px] text-gray-600 line-clamp-3">{post.body}</p>
                  )}
                  {post?.images?.[0] && (
                    <img src={assetUrl(post.images[0])} alt="" className="w-full max-h-32 object-cover" />
                  )}
                </div>
              </div>

              <Button
                className="w-full rounded-xl h-9 text-[14px] font-semibold cursor-pointer transition-all duration-200"
                style={{ background: 'oklch(0.46 0.15 143)', boxShadow: '0 4px 14px oklch(0.46 0.15 143 / 0.3)', color: '#ffffff' }}
                disabled={shareMutation.isPending}
                onClick={() => shareMutation.mutate()}
              >
                {shareMutation.isPending ? 'Sharing…' : 'Share now'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
