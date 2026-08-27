'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import { X, Eye } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ReportDialog } from '@/components/moderation/ReportDialog'

export type StoryItem = {
  id: string
  userId: string
  kind: 'photo' | 'video'
  mediaUrl: string
  mediaType: string | null
  caption: string | null
  eventId: string | null
  createdAt: number
  expiresAt: number
  author: {
    id: string
    fullName: string
    avatarUrl: string | null
    username: string | null
  } | null
}

const PHOTO_DURATION_MS = 6000

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function groupByAuthor(stories: StoryItem[]): Map<string, StoryItem[]> {
  const groups = new Map<string, StoryItem[]>()
  for (const story of stories) {
    const list = groups.get(story.userId) ?? []
    list.push(story)
    groups.set(story.userId, list)
  }
  return groups
}

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  readOnly = false,
}: {
  stories: StoryItem[]
  initialIndex: number
  onClose: () => void
  /** Archive mode: no view tracking, no auto-advance timer, no report. */
  readOnly?: boolean
}) {
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.profiles.getMe)
  const markViewed = useMutation(api.stories.markViewed)
  const [index, setIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<number | null>(null)

  const story = stories[index]
  const groups = groupByAuthor(stories)
  const authorGroup = story ? (groups.get(story.userId) ?? []) : []
  const positionInGroup = story ? authorGroup.findIndex((s) => s.id === story.id) : -1

  const ownStory = Boolean(story && me && me._id === story.userId)
  const viewCount = useQuery(
    api.stories.countViews,
    !readOnly && isAuthenticated && ownStory && story
      ? { storyId: story.id as Id<'stories'> }
      : 'skip',
  )

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const go = useCallback(
    (dir: number) => {
      const next = index + dir
      if (next < 0 || next >= stories.length) {
        onClose()
        return
      }
      setIndex(next)
      setProgress(0)
      setPaused(false)
    },
    [index, stories.length, onClose],
  )

  // Mark the story as viewed once it's on screen (skipped in readOnly).
  useEffect(() => {
    if (readOnly || !story) return
    markViewed({ storyId: story.id as Id<'stories'> }).catch(() => {
      /* view tracking is best-effort */
    })
  }, [story, markViewed, readOnly])

  // Auto-advance photos after a fixed duration; videos play and advance on end.
  useEffect(() => {
    if (readOnly || !story || paused) return
    if (story.kind === 'photo') {
      const start = Date.now()
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - start
        setProgress(Math.min(1, elapsed / PHOTO_DURATION_MS))
        if (elapsed >= PHOTO_DURATION_MS) {
          clearTimer()
          go(1)
        }
      }, 100)
      return clearTimer
    }
  }, [story, paused, go, clearTimer, readOnly])

  // Keyboard navigation + Escape to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  useEffect(() => clearTimer, [clearTimer])

  if (!story) return null

  const initials = (story.author?.fullName ?? 'A')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
      className="fixed inset-0 z-[80] flex flex-col bg-black"
    >
      {/* Progress segments for the current author's stories */}
      <div className="relative z-20 flex gap-1 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {authorGroup.map((s, i) => (
          <div
            key={s.id}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
            aria-hidden="true"
          >
            {i < positionInGroup && <div className="h-full w-full bg-white" />}
            {i === positionInGroup && (
              <div
                className="h-full bg-white"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-sm px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close story"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-sm">
          <Avatar className="h-9 w-9 border-2 border-white/30">
            {story.author?.avatarUrl ? (
              <AvatarImage src={story.author.avatarUrl} alt={story.author.fullName} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-label-lg font-semibold text-white">
              {story.author?.fullName ?? 'Anonymous'}
            </p>
            <p className="text-label-sm text-white/60">{timeAgo(story.createdAt)}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-xs">
          {ownStory && viewCount !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-label-sm text-white">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {viewCount} {viewCount === 1 ? 'view' : 'views'}
            </span>
          )}
          {!readOnly && <ReportDialog targetType="story" targetId={story.id} />}
        </div>
      </div>

      {/* Media */}
      <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {story.kind === 'photo' ? (
          <Image src={story.mediaUrl} alt="" fill sizes="100vw" className="object-contain" />
        ) : (
          <video
            key={story.id}
            src={story.mediaUrl}
            autoPlay
            muted
            playsInline
            controls={false}
            className="h-full w-full object-contain"
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onEnded={() => go(1)}
            onClick={(e) => {
              e.stopPropagation()
              const video = e.currentTarget
              if (video.paused) {
                void video.play()
              } else {
                video.pause()
              }
            }}
          />
        )}
      </div>

      {/* Tap zones — tap left/right to navigate, tap center for nothing */}
      <button
        type="button"
        aria-label="Previous story"
        onClick={() => go(-1)}
        className="absolute inset-y-0 left-0 z-10 w-[25%]"
      />
      <button
        type="button"
        aria-label="Next story"
        onClick={() => go(1)}
        className="absolute inset-y-0 right-0 z-10 w-[25%]"
      />

      {/* Bottom caption */}
      {story.caption && (
        <div className="relative z-20 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <p className="whitespace-pre-wrap break-words font-body-md text-white/90">
            {story.caption}
          </p>
        </div>
      )}
    </div>
  )
}
