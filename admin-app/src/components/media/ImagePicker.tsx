'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { getUploadUrl, resolveStorageUrls } from '@/lib/actions/events'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'
import {
  Plus,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Star,
  Trash2,
} from 'lucide-react'

export interface PickedImage {
  url: string
  storageId: string | null
  filter: string
}

export const IMAGE_FILTERS = [
  { id: 'original', label: 'Original', style: 'none' },
  {
    id: 'vivid',
    label: 'Vivid',
    style: 'saturate(1.3) contrast(1.08)',
  },
  {
    id: 'warm',
    label: 'Warm',
    style: 'sepia(0.18) saturate(1.35) hue-rotate(-10deg) brightness(1.05)',
  },
  {
    id: 'cool',
    label: 'Cool',
    style: 'saturate(1.15) hue-rotate(10deg) brightness(1.02)',
  },
  { id: 'mono', label: 'Mono', style: 'grayscale(1) contrast(1.1)' },
]

export function filterStyle(id: string): string {
  return IMAGE_FILTERS.find((f) => f.id === id)?.style ?? 'none'
}

export const ASPECT_OPTIONS = [
  { id: 'original', label: 'Original', className: 'aspect-auto h-64' },
  { id: '1:1', label: '1:1', className: 'aspect-square' },
  { id: '4:5', label: '4:5', className: 'aspect-[4/5]' },
  { id: '16:9', label: '16:9', className: 'aspect-video' },
]

export function ImagePicker({
  images,
  onChange,
  aspectRatio,
  onAspectRatioChange,
  max = 10,
}: {
  images: PickedImage[]
  onChange: (images: PickedImage[]) => void
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
  max?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const confirmClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (list.length === 0) return
      const room = max - images.length
      if (room <= 0) {
        toast.error(`Maximum ${max} images`)
        return
      }
      const toUpload = list.slice(0, room)
      setUploading(true)
      try {
        const storageIds = await Promise.all(
          toUpload.map(async (file): Promise<string | null> => {
            try {
              const uploadUrl = await getUploadUrl()
              let parsed: URL
              try {
                parsed = new URL(uploadUrl)
              } catch {
                toast.error(`Failed to upload ${file.name}`)
                return null
              }
              if (!parsed.protocol.startsWith('https:') && parsed.protocol !== 'http:') {
                toast.error(`Failed to upload ${file.name}`)
                return null
              }
              const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
                credentials: 'omit',
              })
              if (!res.ok) {
                toast.error(`Failed to upload ${file.name}`)
                return null
              }
              const { storageId } = await res.json()
              return storageId ?? null
            } catch {
              toast.error(`Failed to upload ${file.name}`)
              return null
            }
          })
        )
        const ids = storageIds.filter(Boolean) as string[]
        if (ids.length === 0) return
        const urls = await resolveStorageUrls(ids)
        const uploaded: PickedImage[] = ids
          .map((storageId, i): PickedImage | null =>
            urls[i] ? { url: urls[i], storageId, filter: 'original' } : null
          )
          .filter((img): img is PickedImage => img !== null)
        if (uploaded.length > 0) onChange([...images, ...uploaded])
      } catch (err: any) {
        toast.error(getErrorMessage(err, 'Upload failed'))
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [images, max, onChange]
  )

  const clearAll = () => {
    onChange([])
    setConfirmClear(false)
  }

  const requestClearAll = () => {
    setConfirmClear(true)
    if (confirmClearTimer.current) clearTimeout(confirmClearTimer.current)
    confirmClearTimer.current = setTimeout(() => setConfirmClear(false), 3000)
  }

  const move = (from: number, dir: -1 | 1) => {
    const next = [...images]
    const to = from + dir
    if (to < 0 || to >= next.length) return
    ;[next[from], next[to]] = [next[to], next[from]]
    onChange(next)
  }

  const remove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i))
  }

  const setFilter = (i: number, filter: string) => {
    const next = [...images]
    next[i] = { ...next[i], filter }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {/* Aspect ratio */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          Aspect ratio:
        </span>
        {ASPECT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onAspectRatioChange(opt.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              aspectRatio === opt.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid of images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {images.length} / {max} images
            </span>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-destructive">Remove all images?</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-md bg-destructive text-destructive-foreground px-2 py-1 text-[11px] font-semibold hover:bg-destructive/90"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-md border border-outline-variant px-2 py-1 text-[11px] text-muted-foreground hover:bg-surface-container-high"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={requestClearAll}
                className="flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <Trash2 size={11} />
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className="relative group rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high"
            >
              <div className="relative w-full aspect-square">
                <img
                  src={img.url}
                  alt={`Image ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ filter: filterStyle(img.filter) }}
                />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-semibold">
                    <Star size={9} fill="currentColor" /> Cover
                  </span>
                )}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 p-1.5 bg-card">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move left"
                  className="rounded-md p-1 text-muted-foreground hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={14} />
                </button>
                <select
                  value={img.filter}
                  onChange={(e) => setFilter(i, e.target.value)}
                  className="flex-1 min-w-0 rounded-md border border-outline-variant bg-background px-1.5 py-1 text-[11px] focus:outline-none"
                >
                  {IMAGE_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move right"
                  className="rounded-md p-1 text-muted-foreground hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Dropzone / add tile */}
      <div
        onDragOver={(e) => {
          if (uploading) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (uploading) return
          uploadFiles(e.dataTransfer.files)
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click()
        }}
        aria-disabled={uploading}
        className={cn(
          'rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
          uploading && 'pointer-events-none opacity-70',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant hover:border-primary/50'
        )}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Uploading images…</p>
            <div className="w-40 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full bg-primary animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-full bg-surface-container-high p-2.5">
              {images.length > 0 ? (
                <Plus size={18} className="text-primary" />
              ) : (
                <ImagePlus size={18} className="text-primary" />
              )}
            </div>
            <p className="text-sm font-medium">
              {images.length > 0
                ? `Add up to ${max} images`
                : 'Drop images here or click to upload'}
            </p>
            <p className="text-[11px] text-muted-foreground text-center">
              JPG or PNG · first image becomes the event cover
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
    </div>
  )
}
