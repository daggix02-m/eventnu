'use client'

import { useCallback, useRef, useState } from 'react'
import { X, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TextOverlayData {
  text: string
  x: number // percentage 0-100
  y: number
  fontSize: number // px
  color: string
  fontFamily: string
}

interface TextOverlayProps {
  overlay: TextOverlayData
  onChange: (data: TextOverlayData) => void
  onRemove: () => void
  isActive: boolean
  onActivate: () => void
}

const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Space Grotesk, system-ui, sans-serif', label: 'Space Grotesk' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier' },
]

const COLOR_OPTIONS = [
  '#FFFFFF',
  '#000000',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#FF8C00',
  '#8B00FF',
]

const MIN_FONT_SIZE = 16
const MAX_FONT_SIZE = 72

/**
 * A draggable, editable text overlay on the story media.
 * Supports drag-to-position, font selection, color picker, and resize.
 */
export function TextOverlay({
  overlay,
  onChange,
  onRemove,
  isActive,
  onActivate,
}: TextOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, overlayX: 0, overlayY: 0 })
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
        overlayX: overlay.x,
        overlayY: overlay.y,
      }
    },
    [overlay.x, overlay.y, onActivate],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const container = containerRef.current.getBoundingClientRect()
      const dx = ((clientX - dragStart.current.x) / container.width) * 100
      const dy = ((clientY - dragStart.current.y) / container.height) * 100

      const newX = Math.max(0, Math.min(100, dragStart.current.overlayX + dx))
      const newY = Math.max(0, Math.min(100, dragStart.current.overlayY + dy))

      onChange({ ...overlay, x: newX, y: newY })
    },
    [isDragging, overlay, onChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Attach global listeners for drag
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
      // Cleanup on mouse up
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
    <div
      ref={containerRef}
      className="absolute inset-0 z-20"
      onClick={(e) => {
        e.stopPropagation()
        if (!isActive) onActivate()
      }}
    >
      {/* The text element */}
      <div
        role="button"
        tabIndex={0}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsEditing(true)
          }
        }}
        className={cn(
          'absolute cursor-move select-none whitespace-pre-wrap break-words text-center',
          'touch-none',
          isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-black/50 rounded',
        )}
        style={{
          left: `${overlay.x}%`,
          top: `${overlay.y}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${overlay.fontSize}px`,
          color: overlay.color,
          fontFamily: overlay.fontFamily,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        {overlay.text}

        {/* Delete button when active */}
        {isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
            aria-label="Remove text"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Editing controls when active */}
      {isActive && isEditing && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 space-y-2 bg-black/80 p-3 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Text input */}
          <input
            type="text"
            value={overlay.text}
            onChange={(e) => onChange({ ...overlay, text: e.target.value })}
            placeholder="Type something..."
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
            autoFocus
          />

          {/* Font size slider */}
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-white/60" />
            <input
              type="range"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={overlay.fontSize}
              onChange={(e) => onChange({ ...overlay, fontSize: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="w-8 text-right text-xs text-white/60">{overlay.fontSize}</span>
          </div>

          {/* Font family */}
          <div className="flex gap-1">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() => onChange({ ...overlay, fontFamily: font.value })}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs transition-colors',
                  overlay.fontFamily === font.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-white/10 text-white/70 hover:bg-white/20',
                )}
              >
                {font.label}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex gap-1">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ ...overlay, color })}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform',
                  overlay.color === color
                    ? 'scale-110 border-primary'
                    : 'border-transparent hover:scale-105',
                )}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>

          {/* Done button */}
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-on-primary"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

interface TextOverlayEditorProps {
  overlays: TextOverlayData[]
  onChange: (overlays: TextOverlayData[]) => void
  maxOverlays?: number
}

/**
 * Manages a collection of text overlays with add/remove capabilities.
 * Renders a floating "Add text" button and the overlay controls.
 */
export function TextOverlayEditor({ overlays, onChange, maxOverlays = 5 }: TextOverlayEditorProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const addOverlay = () => {
    if (overlays.length >= maxOverlays) return
    const newOverlay: TextOverlayData = {
      text: 'Your text',
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#FFFFFF',
      fontFamily: 'Inter, system-ui, sans-serif',
    }
    onChange([...overlays, newOverlay])
    setActiveIndex(overlays.length)
  }

  const updateOverlay = (index: number, data: TextOverlayData) => {
    const updated = [...overlays]
    updated[index] = data
    onChange(updated)
  }

  const removeOverlay = (index: number) => {
    onChange(overlays.filter((_, i) => i !== index))
    setActiveIndex(null)
  }

  return (
    <>
      {/* Render overlays */}
      {overlays.map((overlay, i) => (
        <TextOverlay
          key={i}
          overlay={overlay}
          onChange={(data) => updateOverlay(i, data)}
          onRemove={() => removeOverlay(i)}
          isActive={activeIndex === i}
          onActivate={() => setActiveIndex(i)}
        />
      ))}

      {/* Add button (shown when no overlay is active and under limit) */}
      {activeIndex === null && overlays.length < maxOverlays && (
        <button
          type="button"
          onClick={addOverlay}
          className="absolute bottom-16 left-4 z-30 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <Type className="h-3.5 w-3.5" />
          Add text
        </button>
      )}
    </>
  )
}
