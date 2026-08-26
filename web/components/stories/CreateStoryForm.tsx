'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { Camera, Clapperboard, Loader2, Send } from 'lucide-react'
import { compressImage } from '@eventnu/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_CAPTION = 500

export function CreateStoryForm() {
  const publish = useMutation(api.stories.publish)
  const getUploadUrl = useMutation(api.events.write.generateUploadUrl)
  const events = useQuery(api.events.read.getPublished)

  const [kind, setKind] = useState<'photo' | 'video'>('photo')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [eventId, setEventId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const canSubmit = !!mediaFile && !submitting

  const resetForm = () => {
    setMediaFile(null)
    setCaption('')
    setEventId('')
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!mediaFile) {
      setError('Choose a photo or video first.')
      return
    }

    let mediaStorageId: string | undefined
    try {
      // Photos are compressed before upload; videos pass through untouched.
      const fileToUpload = kind === 'photo' ? await compressImage(mediaFile) : mediaFile
      const uploadUrl = await getUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': fileToUpload.type },
        body: fileToUpload,
      })
      if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
      const { storageId } = await res.json()
      if (!storageId) throw new Error('Upload failed')
      mediaStorageId = storageId as string
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media')
      return
    }

    setSubmitting(true)
    try {
      await publish({
        kind,
        mediaStorageId,
        caption: caption.trim() || undefined,
        eventId: eventId ? (eventId as Id<'events'>) : undefined,
      })
      resetForm()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish your story')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant bg-surface-container-low p-md"
      aria-label="Create a story"
    >
      <h2 className="font-display text-headline-sm text-on-surface">Create a story</h2>
      <p className="mt-xs font-body-sm text-on-surface-variant">
        Photos and videos disappear after 24 hours.
      </p>

      <div className="mt-md flex items-center gap-sm" role="radiogroup" aria-label="Story type">
        <button
          type="button"
          role="radio"
          aria-checked={kind === 'photo'}
          onClick={() => setKind('photo')}
          className={cn(
            'inline-flex items-center gap-xs rounded-xl border px-md py-2 font-label-md transition-colors',
            kind === 'photo'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
          )}
        >
          <Camera className="h-4 w-4" aria-hidden="true" /> Photo
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={kind === 'video'}
          onClick={() => setKind('video')}
          className={cn(
            'inline-flex items-center gap-xs rounded-xl border px-md py-2 font-label-md transition-colors',
            kind === 'video'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
          )}
        >
          <Clapperboard className="h-4 w-4" aria-hidden="true" /> Video
        </button>
      </div>

      <label
        htmlFor="story-media"
        className="mt-md flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-md py-8 text-center font-label-md text-on-surface-variant transition-colors hover:border-primary/60 hover:text-primary"
      >
        {mediaFile ? mediaFile.name : kind === 'photo' ? 'Choose a photo' : 'Choose a video'}
        <input
          id="story-media"
          type="file"
          accept={
            kind === 'photo'
              ? 'image/png,image/jpeg,image/webp'
              : 'video/mp4,video/quicktime,video/webm'
          }
          className="sr-only"
          onChange={(e) => {
            setMediaFile(e.target.files?.[0] ?? null)
            setSuccess(false)
          }}
        />
      </label>

      <label htmlFor="story-caption" className="mt-md block font-label-md text-on-surface-variant">
        Caption <span className="font-body-sm">(optional)</span>
      </label>
      <textarea
        id="story-caption"
        value={caption}
        onChange={(e) => {
          setCaption(e.target.value)
          setSuccess(false)
        }}
        maxLength={MAX_CAPTION}
        rows={2}
        placeholder="What's the moment?"
        className="mt-xs w-full resize-y rounded-xl border border-outline-variant bg-surface-container-low px-md py-3 font-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="mt-md flex flex-wrap items-center gap-md">
        <label htmlFor="story-event" className="font-label-md text-on-surface-variant">
          Event (optional)
        </label>
        <select
          id="story-event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full max-w-[18rem] rounded-lg border border-outline bg-surface-container-lowest px-sm py-2 font-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-auto"
        >
          <option value="">No specific event</option>
          {(events ?? []).map(
            (event: FunctionReturnType<typeof api.events.read.getPublished>[number]) => (
              <option key={event._id as string} value={event._id as string}>
                {event.title}
              </option>
            ),
          )}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-md font-body-sm text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-md font-body-sm text-primary">
          Your story is live for 24 hours.
        </p>
      )}

      <Button type="submit" disabled={!canSubmit} className="mt-md">
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {submitting ? 'Publishing…' : 'Publish story'}
      </Button>
    </form>
  )
}
