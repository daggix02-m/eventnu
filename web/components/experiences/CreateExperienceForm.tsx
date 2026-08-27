'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { ImagePlus, Loader2, Send, X, Tag } from 'lucide-react'
import { compressImage } from '@eventnu/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EventSearchSelect } from '@/components/stories/camera/EventSearchSelect'

const MAX_CONTENT_LENGTH = 2000

export function CreateExperienceForm({
  initialEventId,
  eventTitle,
}: {
  initialEventId?: string
  eventTitle?: string
}) {
  const createPost = useMutation(api.experiencePosts.create)
  const getUploadUrl = useMutation(api.events.write.generateUploadUrl)

  const [content, setContent] = useState('')
  const [eventId, setEventId] = useState(initialEventId ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showEventPicker, setShowEventPicker] = useState(!!initialEventId)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = content.trim().length >= 3 && !submitting

  const resetForm = () => {
    setContent('')
    setEventId('')
    setImageFile(null)
    setImagePreviewUrl(null)
    setSuccess(false)
    setShowEventPicker(!!initialEventId)
  }

  const handleImageSelect = (file: File) => {
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    setSuccess(false)
  }

  const removeImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    let imageStorageId: string | undefined
    if (imageFile) {
      try {
        const fileToUpload = await compressImage(imageFile)
        const uploadUrl = await getUploadUrl()
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': fileToUpload.type },
          body: fileToUpload,
        })
        if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
        const { storageId } = await res.json()
        if (!storageId) throw new Error('Upload failed')
        imageStorageId = storageId as string
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
        return
      }
    }

    setSubmitting(true)
    try {
      await createPost({
        content,
        eventId: eventId ? (eventId as Id<'events'>) : undefined,
        imageStorageId,
      })
      resetForm()
      setSuccess(true)
      // Auto-hide success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share your experience')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-outline-variant bg-surface-container-low p-md"
      aria-label="Share your experience"
    >
      {/* Textarea */}
      <label htmlFor="experience-content" className="font-label-lg text-on-surface">
        Share your experience
        {eventTitle ? (
          <span className="block font-body-sm text-on-surface-variant">about {eventTitle}</span>
        ) : null}
      </label>
      <textarea
        id="experience-content"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setSuccess(false)
        }}
        maxLength={MAX_CONTENT_LENGTH}
        rows={4}
        required
        placeholder="What was the vibe? How was the music, the crowd, the moment?"
        className="mt-sm w-full resize-y rounded-lg border border-outline bg-surface-container-lowest px-sm py-sm font-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <p
        className={cn(
          'mt-xs text-right font-body-sm',
          content.length > MAX_CONTENT_LENGTH * 0.9
            ? 'text-error'
            : content.length > MAX_CONTENT_LENGTH * 0.75
              ? 'text-amber-500'
              : 'text-on-surface-variant',
        )}
      >
        {content.length}/{MAX_CONTENT_LENGTH}
      </p>

      {/* Inline image preview */}
      {imagePreviewUrl && (
        <div className="relative mt-sm inline-block">
          <Image
            src={imagePreviewUrl}
            alt="Selected photo preview"
            width={120}
            height={120}
            className="h-24 w-24 rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error shadow-lg"
            aria-label="Remove photo"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Action chips */}
      <div className="mt-sm flex flex-wrap gap-2">
        {/* Photo chip */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            imageFile
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline text-on-surface-variant hover:border-primary hover:text-primary',
          )}
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {imageFile ? 'Photo added' : 'Photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageSelect(file)
          }}
        />

        {/* Event chip */}
        <button
          type="button"
          onClick={() => setShowEventPicker(!showEventPicker)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            eventId
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline text-on-surface-variant hover:border-primary hover:text-primary',
          )}
        >
          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
          {eventId ? 'Event tagged' : 'Event'}
        </button>
      </div>

      {/* Event search (progressive disclosure) */}
      {showEventPicker && (
        <div className="mt-sm">
          <EventSearchSelect value={eventId} onChange={setEventId} placeholder="Search events..." />
        </div>
      )}

      {/* Bottom row: status + submit */}
      <div className="mt-md flex items-center gap-md">
        <span className="hidden flex-1 sm:block" aria-hidden="true" />

        {error && (
          <p role="alert" className="flex-1 font-body-sm text-error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="flex-1 font-body-sm text-primary">
            Thanks for sharing!
          </p>
        )}

        <Button type="submit" disabled={!canSubmit} className={cn(submitting && 'opacity-70')}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  )
}
