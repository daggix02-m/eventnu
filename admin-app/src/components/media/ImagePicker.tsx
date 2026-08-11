'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatFileSize, compressImage } from '@/lib/utils'
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
  GripVertical,
  AlertCircle,
} from 'lucide-react'

export interface PickedImage {
  url: string
  storageId: string | null
  filter: string
  fileSize?: number
}

interface UploadItem {
  id: string
  file: File
  preview: string
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error'
  error?: string
  result?: PickedImage
}

const MAX_FILE_SIZE = 6 * 1024 * 1024
const MAX_TOTAL_SIZE = 50 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const IMAGE_FILTERS = [
  { id: 'original', label: 'Original', style: 'none' },
  { id: 'vivid', label: 'Vivid', style: 'saturate(1.3) contrast(1.08)' },
  {
    id: 'warm',
    label: 'Warm',
    style: 'sepia(0.18) saturate(1.35) hue-rotate(-10deg) brightness(1.05)',
  },
  { id: 'cool', label: 'Cool', style: 'saturate(1.15) hue-rotate(10deg) brightness(1.02)' },
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

function validateFile(file: File, currentCount: number, max: number): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported format. Use JPG, PNG, or WebP.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" is ${formatFileSize(file.size)} — max is 6 MB.`
  }
  if (currentCount >= max) {
    return `Maximum ${max} images allowed.`
  }
  return null
}

function validateTotalSize(files: File[], existing: PickedImage[]): string | null {
  const existingBytes = existing.reduce((sum, img) => sum + (img.fileSize ?? 0), 0)
  const newBytes = files.reduce((sum, f) => sum + f.size, 0)
  if (existingBytes + newBytes > MAX_TOTAL_SIZE) {
    return `Total size would exceed 50 MB limit.`
  }
  return null
}

function ImageTile({
  img,
  index,
  total,
  onMove,
  onRemove,
  onFilter,
  dragHandlers,
  isDragging,
}: {
  img: PickedImage
  index: number
  total: number
  onMove: (from: number, dir: -1 | 1) => void
  onRemove: (i: number) => void
  onFilter: (i: number, filter: string) => void
  dragHandlers: {
    onDragStart: (e: React.DragEvent, index: number) => void
    onDragOver: (e: React.DragEvent, index: number) => void
    onDragEnd: () => void
  }
  isDragging: boolean
}) {
  return (
    <div
      draggable
      onDragStart={(e) => dragHandlers.onDragStart(e, index)}
      onDragOver={(e) => dragHandlers.onDragOver(e, index)}
      onDragEnd={dragHandlers.onDragEnd}
      className={cn(
        'relative group rounded-xl overflow-hidden border bg-surface-container-high transition-all',
        isDragging ? 'opacity-50 border-primary scale-95' : 'border-outline-variant',
      )}
    >
      <div className="relative w-full aspect-square">
        <img
          src={img.url}
          alt={`Image ${index + 1}`}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ filter: filterStyle(img.filter) }}
        />
        {index === 0 && (
          <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-semibold">
            <Star size={9} fill="currentColor" /> Cover
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Remove image"
          className="absolute top-1.5 right-1.5 rounded-full bg-black/60 text-white p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <X size={12} />
        </button>
        <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <div className="rounded-md bg-black/60 text-white p-1">
            <GripVertical size={12} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1.5 bg-card">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          aria-label="Move left"
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={14} />
        </button>
        <select
          value={img.filter}
          onChange={(e) => onFilter(index, e.target.value)}
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
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          aria-label="Move right"
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function UploadingTile({ item }: { item: UploadItem }) {
  const isProcessing = item.status === 'pending' || item.status === 'compressing'
  const isUploading = item.status === 'uploading'
  const isError = item.status === 'error'

  return (
    <div className="relative rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high">
      <div className="relative w-full aspect-square">
        <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
        {(isProcessing || isUploading) && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-white" />
            <span className="text-[11px] text-white font-medium">
              {isProcessing ? 'Preparing...' : 'Uploading...'}
            </span>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 p-2">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-[10px] text-red-300 text-center leading-tight">
              {item.error ?? 'Failed'}
            </span>
          </div>
        )}
      </div>
      <div className="p-1.5 bg-card">
        <p className="text-[10px] text-muted-foreground truncate">{item.file.name}</p>
        <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</p>
      </div>
    </div>
  )
}

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
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const confirmClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const queueRef = useRef(uploadQueue)

  useEffect(() => {
    queueRef.current = uploadQueue
  })

  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview)
      })
    }
  }, [])

  const processUpload = useCallback(async (item: UploadItem) => {
    setUploadQueue((q) => q.map((u) => (u.id === item.id ? { ...u, status: 'compressing' } : u)))

    let fileToUpload = item.file
    try {
      fileToUpload = await compressImage(item.file)
    } catch {
      // Fall back to original file if compression fails
      fileToUpload = item.file
    }

    setUploadQueue((q) =>
      q.map((u) => (u.id === item.id ? { ...u, status: 'uploading', file: fileToUpload } : u)),
    )

    try {
      const uploadUrl = await getUploadUrl()
      let parsed: URL
      try {
        parsed = new URL(uploadUrl)
      } catch {
        throw new Error('Invalid upload URL')
      }
      if (!parsed.protocol.startsWith('https:') && parsed.protocol !== 'http:') {
        throw new Error('Invalid upload URL protocol')
      }

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': fileToUpload.type },
        body: fileToUpload,
        credentials: 'omit',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const { storageId } = await res.json()
      if (!storageId) throw new Error('No storage ID returned')

      const [url] = await resolveStorageUrls([storageId])
      if (!url) throw new Error('Failed to resolve storage URL')

      const result: PickedImage = {
        url,
        storageId,
        filter: 'original',
        fileSize: fileToUpload.size,
      }

      setUploadQueue((q) => q.map((u) => (u.id === item.id ? { ...u, status: 'done', result } : u)))
    } catch (err) {
      const msg = getErrorMessage(err, 'Upload failed')
      setUploadQueue((q) =>
        q.map((u) => (u.id === item.id ? { ...u, status: 'error', error: msg } : u)),
      )
    }
  }, [])

  useEffect(() => {
    const pending = uploadQueue.filter((u) => u.status === 'pending')
    pending.forEach((item) => processUpload(item))
  }, [uploadQueue, processUpload])

  useEffect(() => {
    const done = uploadQueue.filter((u) => u.status === 'done' && u.result)
    if (done.length === 0) return

    const newImages = done.map((u) => u.result!)
    onChange([...images, ...newImages])

    setUploadQueue((q) => q.filter((u) => u.status !== 'done'))
  }, [uploadQueue, images, onChange])

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      const room = max - images.length
      if (room <= 0) {
        toast.error(`Maximum ${max} images`)
        return
      }

      const validFiles: File[] = []
      for (const file of list.slice(0, room)) {
        const error = validateFile(file, images.length + validFiles.length, max)
        if (error) {
          toast.error(error)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      const totalError = validateTotalSize(validFiles, images)
      if (totalError) {
        toast.error(totalError)
        return
      }

      const newItems: UploadItem[] = validFiles.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      }))

      setUploadQueue((q) => [...q, ...newItems])

      if (inputRef.current) inputRef.current.value = ''
    },
    [images, max],
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndex(index)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragIndex
    const to = dropIndex
    setDragIndex(null)
    setDropIndex(null)

    if (from === null || to === null || from === to) return

    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDropIndex(null)
  }

  const isUploading = uploadQueue.length > 0
  const room = max - images.length - uploadQueue.filter((u) => u.status !== 'error').length
  const progress =
    uploadQueue.length > 0
      ? Math.round(
          (uploadQueue.filter((u) => u.status === 'done').length / uploadQueue.length) * 100,
        )
      : 0

  return (
    <div className="space-y-4">
      {/* Aspect ratio */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Aspect ratio:</span>
        {ASPECT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onAspectRatioChange(opt.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              aspectRatio === opt.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Upload progress summary */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Uploading {uploadQueue.length} file{uploadQueue.length > 1 ? 's' : ''}...
            </span>
            <span className="text-xs font-medium text-primary">{progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid of images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {images.length} / {max} images
              {room > 0 && room < max && (
                <span className="text-muted-foreground/60">
                  {' '}
                  · {room} slot{room !== 1 ? 's' : ''} left
                </span>
              )}
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
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {images.map((img, i) => (
              <ImageTile
                key={`${img.storageId}-${i}`}
                img={img}
                index={i}
                total={images.length}
                onMove={move}
                onRemove={remove}
                onFilter={setFilter}
                dragHandlers={{
                  onDragStart: handleDragStart,
                  onDragOver: handleDragOver,
                  onDragEnd: handleDragEnd,
                }}
                isDragging={dragIndex === i}
              />
            ))}
            {uploadQueue.map((item) => (
              <UploadingTile key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Dropzone / add tile */}
      <div
        onDragOver={(e) => {
          if (isUploading) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (isUploading) return
          uploadFiles(e.dataTransfer.files)
        }}
        onClick={() => {
          if (!isUploading) inputRef.current?.click()
        }}
        aria-disabled={isUploading}
        className={cn(
          'rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
          isUploading && 'pointer-events-none opacity-70',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant hover:border-primary/50',
        )}
      >
        <div className="rounded-full bg-surface-container-high p-3">
          {images.length > 0 ? (
            <Plus size={22} className="text-primary" />
          ) : (
            <ImagePlus size={22} className="text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {images.length > 0
              ? `Add up to ${room} more image${room !== 1 ? 's' : ''}`
              : 'Drop images here or click to upload'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            JPG, PNG, or WebP · Max 6 MB each · First image becomes the cover
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
    </div>
  )
}
