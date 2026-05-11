import { useState } from 'react'
import { Button } from '../ui/button'

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'haha', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😡' },
]

export default function ReactionPicker({ onReact, currentType, count = 0 }) {
  const [open, setOpen] = useState(false)
  const active = REACTIONS.find((r) => r.type === currentType)

  return (
    <div className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => onReact(currentType ? null : 'like')}
      >
        <span>{active ? active.emoji : '👍'}</span>
        <span>{count > 0 ? count : 'Like'}</span>
      </Button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 flex gap-1 bg-popover border rounded-full px-2 py-1 shadow-lg z-10"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              className="text-xl hover:scale-125 transition-transform cursor-pointer"
              onClick={() => { onReact(r.type); setOpen(false) }}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
