import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ArrowLeft, Send, ImagePlus } from 'lucide-react'
import { getConversations, getMessages, sendMessage } from '../../api/chat'
import { assetUrl, formatDistanceToNow } from '../../lib/utils'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'

function Avatar({ user, size = 36 }) {
  const initials = user?.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.38,
        ...(user?.avatar
          ? { border: '2px solid rgba(24,119,242,0.25)' }
          : { background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)' }),
      }}
    >
      {user?.avatar
        ? <img src={assetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
        : initials}
    </div>
  )
}

function ConversationList({ dark, authUser, onSelect }) {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations().then(r => r.data),
    refetchInterval: 8000,
  })

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-[#1877F2] border-t-transparent animate-spin" />
    </div>
  )

  if (!data?.length) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-[14px] font-semibold" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>No conversations yet</p>
      <p className="text-[12px]" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>Visit someone's profile and message them to get started</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {data.map(conv => {
        const other = conv.participants?.find(p => p.uuid !== authUser?.uuid)
        const lastMsg = conv.latest_message
        const unread = conv.unread_count ?? 0
        return (
          <button
            key={conv.uuid}
            onClick={() => onSelect(conv.uuid, other)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150"
            style={{ background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Avatar user={other} size={40} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-semibold truncate" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>
                  {other?.name ?? 'Unknown'}
                </span>
                {lastMsg && (
                  <span className="text-[11px] shrink-0" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>
                    {formatDistanceToNow(lastMsg.created_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <p className="text-[12px] truncate flex-1" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>
                  {lastMsg ? lastMsg.body : 'No messages yet'}
                </p>
                {unread > 0 && (
                  <span
                    className="shrink-0 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: '#1877F2' }}
                  >
                    {unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MessageThread({ dark, authUser, convUuid, other, onBack }) {
  const qc = useQueryClient()
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const [body, setBody] = useState('')
  const [images, setImages] = useState([]) // File[]
  const [previews, setPreviews] = useState([]) // object URL strings

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', convUuid],
    queryFn: () => getMessages(convUuid).then(r => r.data),
    refetchInterval: 3000,
  })

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['conversations'] })
    qc.invalidateQueries({ queryKey: ['chat-unread'] })
  }, [messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Clean up preview URLs on unmount
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const canSend = (body.trim() || images.length > 0) && !mutation?.isPending

  const mutation = useMutation({
    mutationFn: () => sendMessage(convUuid, body.trim(), images),
    onSuccess: () => {
      setBody('')
      setImages([])
      setPreviews(prev => { prev.forEach(URL.revokeObjectURL); return [] })
      qc.invalidateQueries({ queryKey: ['messages', convUuid] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const handleSend = () => {
    if (!canSend) return
    mutation.mutate()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleFiles = (e) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setImages(files)
    setPreviews(prev => { prev.forEach(URL.revokeObjectURL); return files.map(f => URL.createObjectURL(f)) })
    e.target.value = ''
  }

  const removeImage = (i) => {
    URL.revokeObjectURL(previews[i])
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    const isMe = msg.sender?.uuid === authUser?.uuid
    const sameSender = prev && prev.sender?.uuid === msg.sender?.uuid
    acc.push({ ...msg, isMe, sameSender })
    return acc
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div
        className="flex items-center gap-2 px-3 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}` }}
      >
        <button
          onClick={onBack}
          className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: dark ? '#9ca3af' : '#6b7280' }} />
        </button>
        <Link
          to={`/users/${other?.uuid}`}
          onClick={close}
          className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-75 transition-opacity"
        >
          <Avatar user={other} size={32} />
          <span className="text-[13px] font-semibold truncate" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>
            {other?.name ?? 'Unknown'}
          </span>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {groupedMessages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[12px]" style={{ color: dark ? '#6b7280' : '#9ca3af' }}>Say hi!</p>
          </div>
        )}
        {groupedMessages.map((msg) => (
          <div key={msg.uuid} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} ${msg.sameSender ? 'mt-0.5' : 'mt-2'}`}>
            {!msg.isMe && !msg.sameSender && (
              <div className="mr-1.5 self-end shrink-0">
                <Avatar user={msg.sender} size={22} />
              </div>
            )}
            {!msg.isMe && msg.sameSender && <div style={{ width: 24 }} />}
            <div className="max-w-[78%] flex flex-col gap-1">
              {/* Images grid */}
              {msg.images?.length > 0 && (
                <div className={`grid gap-1 ${msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {msg.images.map((src, i) => (
                    <img
                      key={i}
                      src={assetUrl(src)}
                      alt=""
                      className="rounded-xl object-cover w-full cursor-pointer"
                      style={{ maxHeight: 180 }}
                      onClick={() => window.open(assetUrl(src), '_blank')}
                    />
                  ))}
                </div>
              )}
              {/* Text bubble */}
              {msg.body && (
                <div
                  className="px-3 py-2 rounded-2xl text-[13px] leading-snug break-words"
                  style={msg.isMe
                    ? { background: '#1877F2', color: 'white', borderBottomRightRadius: msg.sameSender ? 8 : undefined }
                    : {
                        background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                        color: dark ? '#e4e6eb' : '#1c1e21',
                        borderBottomLeftRadius: msg.sameSender ? 8 : undefined,
                      }
                  }
                >
                  {msg.body}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image previews */}
      {previews.length > 0 && (
        <div
          className="px-3 pt-2 flex gap-2 flex-wrap shrink-0"
          style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}` }}
        >
          {previews.map((src, i) => (
            <div key={i} className="relative shrink-0">
              <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[11px] font-bold cursor-pointer hover:bg-red-500 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-3 py-3 shrink-0 flex items-end gap-2"
        style={{ borderTop: previews.length > 0 ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}` }}
      >
        {/* Image picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          title="Send images"
        >
          <ImagePlus className="h-4 w-4" style={{ color: images.length > 0 ? '#1877F2' : (dark ? '#9ca3af' : '#6b7280') }} />
        </button>

        <textarea
          rows={1}
          placeholder="Message…"
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 resize-none rounded-2xl px-3 py-2 text-[13px] outline-none transition-all"
          style={{
            background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            color: dark ? '#e4e6eb' : '#1c1e21',
            border: '1.5px solid transparent',
            maxHeight: 96,
            lineHeight: '1.4',
          }}
          onFocus={e => { e.target.style.border = '1.5px solid rgba(24,119,242,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(24,119,242,0.1)' }}
          onBlur={e => { e.target.style.border = '1.5px solid transparent'; e.target.style.boxShadow = 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all"
          style={{
            background: canSend ? '#1877F2' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            cursor: canSend ? 'pointer' : 'default',
          }}
        >
          <Send className="h-4 w-4" style={{ color: canSend ? 'white' : (dark ? '#4b5563' : '#9ca3af') }} />
        </button>
      </div>
    </div>
  )
}

export default function ChatPanel() {
  const { dark } = useThemeStore()
  const { user } = useAuthStore()
  const { open, activeConvUuid, activeOther, close } = useChatStore()
  const [activeConv, setActiveConv] = useState(null) // { uuid, other }

  useEffect(() => {
    if (activeConvUuid && activeOther) {
      setActiveConv({ uuid: activeConvUuid, other: activeOther })
    }
  }, [activeConvUuid, activeOther])

  const bg = dark ? 'rgba(36,37,38,0.98)' : 'rgba(255,255,255,0.97)'
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 z-[98] md:hidden"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={close}
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-[99] flex flex-col"
        style={{
          width: 340,
          background: bg,
          borderLeft: `1px solid ${border}`,
          boxShadow: dark ? '-4px 0 32px rgba(0,0,0,0.5)' : '-4px 0 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 shrink-0"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <span className="text-[15px] font-bold" style={{ color: dark ? '#e4e6eb' : '#1c1e21' }}>
            Messages
          </span>
          <button
            onClick={close}
            className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X className="h-4 w-4" style={{ color: dark ? '#9ca3af' : '#6b7280' }} />
          </button>
        </div>

        {/* Content */}
        {activeConv ? (
          <MessageThread
            dark={dark}
            authUser={user}
            convUuid={activeConv.uuid}
            other={activeConv.other}
            onBack={() => setActiveConv(null)}
          />
        ) : (
          <ConversationList
            dark={dark}
            authUser={user}
            onSelect={(uuid, other) => setActiveConv({ uuid, other })}
          />
        )}
      </div>
    </>,
    document.body
  )
}
