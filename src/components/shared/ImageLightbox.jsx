import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { assetUrl } from '../../lib/utils'

export default function ImageLightbox({ images, index, onNavigate, onClose }) {
  const total = images.length

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
    if (e.key === 'ArrowRight' && index < total - 1) onNavigate(index + 1)
  }, [index, total, onClose, onNavigate])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="cursor-pointer absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-[13px] font-semibold bg-black/40 rounded-full px-3 py-1 z-10 pointer-events-none">
          {index + 1} / {total}
        </div>
      )}

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }}
          className="cursor-pointer absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      {/* Next */}
      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }}
          className="cursor-pointer absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}

      {/* Main image */}
      <img
        key={index}
        src={assetUrl(images[index])}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[88vw] object-contain rounded-xl select-none"
        style={{ animation: 'fadeIn 0.15s ease-out both' }}
      />

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className="cursor-pointer shrink-0 rounded-lg overflow-hidden transition-all duration-200 hover:opacity-100"
              style={{
                width: i === index ? 48 : 36,
                height: i === index ? 48 : 36,
                opacity: i === index ? 1 : 0.5,
                outline: i === index ? '2px solid white' : 'none',
                outlineOffset: 2,
              }}
            >
              <img src={assetUrl(src)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
