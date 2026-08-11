'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Heart, Bookmark, Share2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/components/auth/AuthModalContext'

function useAuthGate() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { openAuth } = useAuthModal()
  return { isAuthenticated, isLoading, openAuth }
}

export function LikeButton({
  eventId,
  className,
  variant = 'outline',
}: {
  eventId: string
  className?: string
  variant?: 'outline' | 'icon'
}) {
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const toggle = useMutation(api.likes.toggle)
  const liked = useQuery(api.likes.hasLiked, { eventId: eventId as any })
  const count = useQuery(api.likes.countByEvent, { eventId: eventId as any })
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    setPending(true)
    try {
      await toggle({ eventId: eventId as any })
    } catch {
      /* swallow */
    } finally {
      setPending(false)
    }
  }

  const buttonClass =
    variant === 'icon'
      ? 'inline-flex items-center justify-center rounded-full p-2 transition-colors'
      : cn(
          'inline-flex items-center gap-xs rounded-xl border px-md py-2 text-body-md font-bold transition-all',
          liked
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/50',
        )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || isLoading}
      aria-pressed={!!liked}
      aria-label={liked ? 'Unlike this event' : 'Like this event'}
      className={cn(buttonClass, className)}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn('h-4 w-4', liked && 'fill-primary text-primary')} aria-hidden="true" />
      )}
      {variant !== 'icon' && <span>{count ?? 0}</span>}
    </button>
  )
}

export function BookmarkButton({
  eventId,
  className,
  variant = 'outline',
  label = 'Save',
}: {
  eventId: string
  className?: string
  variant?: 'outline' | 'icon'
  label?: string
}) {
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const toggle = useMutation(api.bookmarks.toggle)
  const saved = useQuery(api.bookmarks.hasBookmarked, { eventId: eventId as any })
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    setPending(true)
    try {
      await toggle({ eventId: eventId as any })
    } catch {
      /* swallow */
    } finally {
      setPending(false)
    }
  }

  const buttonClass =
    variant === 'icon'
      ? 'inline-flex items-center justify-center rounded-full p-2 transition-colors'
      : cn(
          'inline-flex items-center gap-xs rounded-xl border px-md py-2 text-body-md font-bold transition-all',
          saved
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/50',
        )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || isLoading}
      aria-pressed={!!saved}
      aria-label={
        saved ? 'Remove from saved events' : `Save this event${label ? ` (${label})` : ''}`
      }
      className={cn(buttonClass, className)}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark
          className={cn('h-4 w-4', saved && 'fill-primary text-primary')}
          aria-hidden="true"
        />
      )}
      {variant !== 'icon' && <span>{label}</span>}
    </button>
  )
}

export function ShareButton({
  eventId,
  title,
  className,
  variant = 'outline',
}: {
  eventId: string
  title: string
  className?: string
  variant?: 'outline' | 'icon'
}) {
  const track = useMutation(api.shares.track)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    try {
      await track({ eventId: eventId as any, platform: 'native' })
    } catch {
      /* share tracking is best-effort */
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch {
        /* user cancelled or unsupported */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? 'Link copied' : 'Share this event'}
      className={cn(
        'inline-flex items-center gap-xs rounded-xl border border-outline-variant px-md py-2 text-body-md font-bold text-on-surface-variant transition-all hover:text-primary hover:border-primary/50',
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {variant !== 'icon' && <span>Share</span>}
        </>
      )}
    </button>
  )
}

export function EventSocialActions({
  eventId,
  title,
  className,
}: {
  eventId: string
  title: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-sm', className)} aria-label="Event actions">
      <LikeButton eventId={eventId} />
      <BookmarkButton eventId={eventId} />
      <ShareButton eventId={eventId} title={title} />
    </div>
  )
}

export function CardQuickActions({ eventId, className }: { eventId: string; className?: string }) {
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const toggleLike = useMutation(api.likes.toggle)
  const toggleBookmark = useMutation(api.bookmarks.toggle)
  const liked = useQuery(api.likes.hasLiked, { eventId: eventId as any })
  const saved = useQuery(api.bookmarks.hasBookmarked, { eventId: eventId as any })

  const guard = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handle = async (e: React.MouseEvent, action: () => Promise<unknown>) => {
    guard(e)
    if (!isAuthenticated) {
      openAuth()
      return
    }
    try {
      await action()
    } catch {
      /* swallow */
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-xs rounded-full bg-black/50 p-xs backdrop-blur-md',
        className,
      )}
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={(e) => handle(e, () => toggleLike({ eventId: eventId as any }))}
        disabled={isLoading}
        aria-pressed={!!liked}
        aria-label={liked ? 'Unlike this event' : 'Like this event'}
        className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
      >
        <Heart className={cn('h-4 w-4', liked && 'fill-error text-error')} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={(e) => handle(e, () => toggleBookmark({ eventId: eventId as any }))}
        disabled={isLoading}
        aria-pressed={!!saved}
        aria-label={saved ? 'Remove from saved events' : 'Save this event'}
        className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
      >
        <Bookmark
          className={cn('h-4 w-4', saved && 'fill-primary text-primary')}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
