'use client'

import { useCallback, useRef, useState } from 'react'
import { X, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StickerData {
  emoji: string
  x: number // percentage 0-100
  y: number
  scale: number
}

interface StickerProps {
  sticker: StickerData
  onChange: (data: StickerData) => void
  onRemove: () => void
  isActive: boolean
  onActivate: () => void
}

const MIN_SCALE = 0.5
const MAX_SCALE = 3

/**
 * A draggable, resizable emoji sticker on the story media.
 * Supports drag-to-position, pinch-to-resize, and double-tap to delete.
 */
export function Sticker({ sticker, onChange, onRemove, isActive, onActivate }: StickerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, stickerX: 0, stickerY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onActivate()
      setIsDragging(true)

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      dragStart.current = {
        x: clientX,
        y: clientY,
        stickerX: sticker.x,
        stickerY: sticker.y,
      }
    },
    [sticker.x, sticker.y, onActivate],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const container = containerRef.current.getBoundingClientRect()
      const dx = ((clientX - dragStart.current.x) / container.width) * 100
      const dy = ((clientY - dragStart.current.y) / container.height) * 100

      const newX = Math.max(0, Math.min(100, dragStart.current.stickerX + dx))
      const newY = Math.max(0, Math.min(100, dragStart.current.stickerY + dy))

      onChange({ ...sticker, x: newX, y: newY })
    },
    [isDragging, sticker, onChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const attachListeners = useCallback(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleMouseMove, { passive: false })
    window.addEventListener('touchend', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      handleMouseDown(e)
      const cleanup = attachListeners()
      const onUp = () => {
        cleanup()
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('touchend', onUp)
      }
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchend', onUp)
    },
    [handleMouseDown, attachListeners],
  )

  return (
    <div ref={containerRef} className="absolute inset-0 z-20">
      <div
        role="button"
        tabIndex={0}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault()
            onRemove()
          }
        }}
        className={cn(
          'absolute cursor-move select-none touch-none',
          isActive && 'ring-2 ring-primary rounded-full',
        )}
        style={{
          left: `${sticker.x}%`,
          top: `${sticker.y}%`,
          transform: `translate(-50%, -50%) scale(${sticker.scale})`,
          fontSize: '2rem',
          lineHeight: 1,
        }}
      >
        {sticker.emoji}

        {/* Delete button when active */}
        {isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
            aria-label="Remove sticker"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Resize handle when active */}
        {isActive && (
          <div
            className="absolute -bottom-1 -right-1 h-4 w-4 cursor-se-resize rounded-full bg-white shadow-lg"
            onMouseDown={(e) => {
              e.stopPropagation()
              const startX = e.clientX
              const startScale = sticker.scale
              const handleMove = (moveE: MouseEvent) => {
                const dx = moveE.clientX - startX
                const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, startScale + dx / 50))
                onChange({ ...sticker, scale: newScale })
              }
              const handleUp = () => {
                window.removeEventListener('mousemove', handleMove)
                window.removeEventListener('mouseup', handleUp)
              }
              window.addEventListener('mousemove', handleMove)
              window.addEventListener('mouseup', handleUp)
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Emoji picker ────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    name: 'Reactions',
    emojis: ['❤️', '🔥', '😂', '😍', '🥳', '😎', '🤘', '👏', '🙌', '💪'],
  },
  {
    name: 'Objects',
    emojis: ['🎉', '🎊', '🎈', '🎵', '🎶', '🎤', '🎧', '🎸', '🏆', '⭐'],
  },
  {
    name: 'Symbols',
    emojis: ['✨', '💫', '🌟', '💥', '⚡', '🌈', '☀️', '🌙', '💎', '🔮'],
  },
  {
    name: 'Places',
    emojis: ['🎪', '🎭', '🎬', '🏟️', '🌃', '🌆', '🌇', '🏙️', '🌍', '🗺️'],
  },
]

interface StickerPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-40 mb-2 max-h-60 overflow-hidden rounded-xl border border-white/20 bg-surface-container-high shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Category tabs */}
      <div className="flex border-b border-white/10">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setActiveCategory(i)}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              activeCategory === i
                ? 'text-primary border-b-2 border-primary'
                : 'text-white/50 hover:text-white/80',
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-5 gap-1 p-2">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-white/10"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

interface StickerOverlayEditorProps {
  stickers: StickerData[]
  onChange: (stickers: StickerData[]) => void
  maxStickers?: number
}

/**
 * Manages a collection of emoji stickers with add/remove capabilities.
 * Renders a floating "Add sticker" button, the sticker picker, and the sticker controls.
 */
export function StickerOverlayEditor({
  stickers,
  onChange,
  maxStickers = 10,
}: StickerOverlayEditorProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const addSticker = (emoji: string) => {
    if (stickers.length >= maxStickers) return
    const newSticker: StickerData = {
      emoji,
      x: 50 + (Math.random() - 0.5) * 20, // Slightly randomized position
      y: 50 + (Math.random() - 0.5) * 20,
      scale: 1,
    }
    onChange([...stickers, newSticker])
    setActiveIndex(stickers.length)
  }

  const updateSticker = (index: number, data: StickerData) => {
    const updated = [...stickers]
    updated[index] = data
    onChange(updated)
  }

  const removeSticker = (index: number) => {
    onChange(stickers.filter((_, i) => i !== index))
    setActiveIndex(null)
  }

  return (
    <>
      {/* Render stickers */}
      {stickers.map((sticker, i) => (
        <Sticker
          key={i}
          sticker={sticker}
          onChange={(data) => updateSticker(i, data)}
          onRemove={() => removeSticker(i)}
          isActive={activeIndex === i}
          onActivate={() => setActiveIndex(i)}
        />
      ))}

      {/* Add sticker button (shown when no sticker is active and under limit) */}
      {activeIndex === null && stickers.length < maxStickers && (
        <div className="absolute bottom-16 right-4 z-30">
          {showPicker && (
            <StickerPicker onSelect={addSticker} onClose={() => setShowPicker(false)} />
          )}
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <Smile className="h-3.5 w-3.5" />
            Sticker
          </button>
        </div>
      )}
    </>
  )
}
