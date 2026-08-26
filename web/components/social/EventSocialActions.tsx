'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Heart, Bookmark, Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function useAuthGate() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  return { isAuthenticated, isLoading, openAuth }
}

/** Light tactile feedback on tap, where the platform supports it. */
function haptic() {
  try {
    navigator.vibrate?.(8)
  } catch {
    /* vibration unsupported — ignore */
  }
}

/**
 * Bulk social state for list pages: collapses N per-card like/bookmark
 * subscriptions into a single query per list. `CardQuickActions` consumes this
 * context when present and falls back to its own per-event query otherwise.
 */
interface BulkSocialState {
  coveredIds: Set<string>
  likedIds: Set<string>
  savedIds: Set<string>
}

const BulkSocialContext = createContext<BulkSocialState | null>(null)

export function BulkSocialProvider({
  eventIds,
  children,
}: {
  eventIds: string[]
  children: React.ReactNode
}) {
  const { isAuthenticated } = useConvexAuth()
  const ids = useMemo(() => [...new Set(eventIds)].sort() as Id<'events'>[], [eventIds])
  const liked = useQuery(api.likes.hasLikedBulk, isAuthenticated ? { eventIds: ids } : 'skip')
  const saved = useQuery(
    api.bookmarks.hasBookmarkedBulk,
    isAuthenticated ? { eventIds: ids } : 'skip',
  )
  const value = useMemo<BulkSocialState>(
    () => ({
      coveredIds: new Set(ids),
      likedIds: new Set(liked ? Object.keys(liked) : []),
      savedIds: new Set(saved ? Object.keys(saved) : []),
    }),
    [ids, liked, saved],
  )
  return <BulkSocialContext.Provider value={value}>{children}</BulkSocialContext.Provider>
}

function LikeButton({
  eventId,
  className,
  variant = 'outline',
}: {
  eventId: string
  className?: string
  variant?: 'outline' | 'icon'
}) {
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const liked = useQuery(
    api.likes.hasLiked,
    isAuthenticated ? { eventId: eventId as Id<'events'> } : 'skip',
  )
  const count = useQuery(api.likes.countByEvent, { eventId: eventId as Id<'events'> })

  const toggleLike = useOptimisticToggle({
    eventId,
    query: api.likes.hasLiked,
    bulkQuery: api.likes.hasLikedBulk,
    countQuery: api.likes.countByEvent,
    mutation: api.likes.toggle,
  })

  const handleClick = () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    haptic()
    toggleLike(liked ?? false)
  }

  const buttonClass =
    variant === 'icon'
      ? 'inline-flex items-center justify-center rounded-full p-2 transition-all active:scale-90'
      : cn(
          'inline-flex items-center gap-xs rounded-xl border px-md py-2 text-body-md font-bold transition-all active:scale-95',
          liked
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/50',
        )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={!!liked}
      aria-label={liked ? 'Unlike this event' : 'Like this event'}
      className={cn(buttonClass, className)}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-primary text-primary')} aria-hidden="true" />
      {variant !== 'icon' && <span>{count ?? 0}</span>}
    </button>
  )
}

function BookmarkButton({
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
  const moveToFolder = useMutation(api.bookmarks.moveToFolder)
  const createFolder = useMutation(api.bookmarks.createFolder)
  const saved = useQuery(
    api.bookmarks.hasBookmarked,
    isAuthenticated ? { eventId: eventId as Id<'events'> } : 'skip',
  )
  const folders = useQuery(api.bookmarks.listFolders, isAuthenticated ? {} : 'skip')
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderPending, setFolderPending] = useState(false)

  const toggleBookmark = useOptimisticToggle({
    eventId,
    query: api.bookmarks.hasBookmarked,
    bulkQuery: api.bookmarks.hasBookmarkedBulk,
    countQuery: api.bookmarks.countByEvent,
    mutation: api.bookmarks.toggle,
  })

  const handleClick = () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    haptic()
    const wasSaved = saved ?? false
    toggleBookmark(wasSaved)
    // Show folder picker when saving (not when unsaving).
    if (!wasSaved) setShowFolderPicker(true)
  }

  const buttonClass =
    variant === 'icon'
      ? 'inline-flex items-center justify-center rounded-full p-2 transition-all active:scale-90'
      : cn(
          'inline-flex items-center gap-xs rounded-xl border px-md py-2 text-body-md font-bold transition-all active:scale-95',
          saved
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/50',
        )

  const assignFolder = async (folderId?: Id<'bookmarkFolders'>) => {
    setFolderPending(true)
    try {
      await moveToFolder({ eventId: eventId as Id<'events'>, folderId })
      setShowFolderPicker(false)
    } catch {
      /* keep the picker open so the user can retry */
    } finally {
      setFolderPending(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setFolderPending(true)
    try {
      const folderId = await createFolder({ name: newFolderName })
      await moveToFolder({ eventId: eventId as Id<'events'>, folderId })
      setNewFolderName('')
      setShowFolderPicker(false)
    } catch {
      /* keep the picker open so the user can retry */
    } finally {
      setFolderPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-pressed={!!saved}
        aria-label={
          saved ? 'Remove from saved events' : `Save this event${label ? ` (${label})` : ''}`
        }
        className={cn(buttonClass, className)}
      >
        <Bookmark
          className={cn('h-4 w-4', saved && 'fill-primary text-primary')}
          aria-hidden="true"
        />
        {variant !== 'icon' && <span>{label}</span>}
      </button>
      <Dialog open={showFolderPicker} onOpenChange={setShowFolderPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organize your saved event</DialogTitle>
            <DialogDescription>
              Choose a folder or leave this event uncategorized.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void assignFolder()}
              disabled={folderPending}
              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-left text-on-surface transition-colors hover:border-primary hover:bg-surface-container-high"
            >
              Uncategorized
            </button>
            {folders?.map(
              (folder: FunctionReturnType<typeof api.bookmarks.listFolders>[number]) => (
                <button
                  key={folder._id}
                  type="button"
                  onClick={() => void assignFolder(folder._id)}
                  disabled={folderPending}
                  className="w-full rounded-xl border border-outline-variant px-4 py-3 text-left text-on-surface transition-colors hover:border-primary hover:bg-surface-container-high"
                >
                  {folder.name}
                </button>
              ),
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              aria-label="New folder name"
              className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface"
              maxLength={60}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCreateFolder()}
              disabled={folderPending}
            >
              Create
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShowFolderPicker(false)}>
              Keep uncategorized
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ShareButton({
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
    haptic()
    const url = window.location.href
    try {
      await track({ eventId: eventId as Id<'events'>, platform: 'native' })
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

/** Shared like state for cards and the card double-tap gesture. */
export function useCardLike(eventId: string) {
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const bulk = useContext(BulkSocialContext)
  const coveredByBulk = bulk?.coveredIds.has(eventId) ?? false

  // On list pages the bulk query is the instant read and the optimistic patch
  // targets it; no per-card subscription is needed (that is the whole point of
  // `BulkSocialProvider`). Outside bulk coverage the value stays unknown until
  // the user taps — same behavior as the pre-refactor card actions.
  const liked = coveredByBulk ? (bulk?.likedIds.has(eventId) ?? false) : undefined

  const toggleLike = useOptimisticToggle({
    eventId,
    query: api.likes.hasLiked,
    bulkQuery: api.likes.hasLikedBulk,
    countQuery: api.likes.countByEvent,
    mutation: api.likes.toggle,
    feedQueries: [
      api.events.read.getPublished,
      api.events.read.getFeatured,
      api.events.read.getByCategory,
      api.events.read.getSimilar,
    ],
  })

  const toggle = useCallback(() => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    haptic()
    toggleLike(liked ?? false)
  }, [isAuthenticated, openAuth, liked, toggleLike])

  return { liked, isLoading, toggle }
}

const cardActionButtonClass = (hoverClass: string, compact: boolean, transparent: boolean) =>
  cn(
    'inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-all active:scale-90',
    compact || transparent ? hoverClass : 'hover:bg-white/10',
  )

/** Card like button — separate, self-contained, bulk-context aware. */
export function CardLikeButton({
  eventId,
  likeCount,
  compact = false,
  transparent = false,
  className,
}: {
  eventId: string
  likeCount?: number
  compact?: boolean
  transparent?: boolean
  className?: string
}) {
  const { liked, isLoading, toggle } = useCardLike(eventId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle()
  }

  const showCount = typeof likeCount === 'number' && likeCount > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-pressed={!!liked}
        aria-label={liked ? 'Unlike this event' : 'Like this event'}
        className={cn(cardActionButtonClass('hover:text-error', compact, transparent), className)}
      >
        <Heart className={cn('h-4 w-4', liked && 'fill-error text-error')} aria-hidden="true" />
      </button>
      {showCount && (
        <span className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-1.5 py-px font-mono text-[10px] font-bold tabular-nums text-white">
          {likeCount}
        </span>
      )}
    </div>
  )
}

/** Card bookmark button — plain optimistic toggle (no folder picker). */
export function CardBookmarkButton({
  eventId,
  compact = false,
  transparent = false,
  className,
}: {
  eventId: string
  compact?: boolean
  transparent?: boolean
  className?: string
}) {
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const bulk = useContext(BulkSocialContext)
  const coveredByBulk = bulk?.coveredIds.has(eventId) ?? false
  const saved = coveredByBulk ? (bulk?.savedIds.has(eventId) ?? false) : undefined

  const toggleBookmark = useOptimisticToggle({
    eventId,
    query: api.bookmarks.hasBookmarked,
    bulkQuery: api.bookmarks.hasBookmarkedBulk,
    countQuery: api.bookmarks.countByEvent,
    mutation: api.bookmarks.toggle,
    feedQueries: [
      api.events.read.getPublished,
      api.events.read.getFeatured,
      api.events.read.getByCategory,
      api.events.read.getSimilar,
    ],
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      openAuth()
      return
    }
    haptic()
    toggleBookmark(saved ?? false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={!!saved}
      aria-label={saved ? 'Remove from saved events' : 'Save this event'}
      className={cn(cardActionButtonClass('hover:text-primary', compact, transparent), className)}
    >
      <Bookmark
        className={cn('h-4 w-4', saved && 'fill-primary text-primary')}
        aria-hidden="true"
      />
    </button>
  )
}

/** Card share button — native share sheet, clipboard fallback, tracked. */
export function CardShareButton({
  eventId,
  title,
  shareUrl,
  compact = false,
  transparent = false,
  className,
}: {
  eventId: string
  title?: string
  shareUrl?: string
  compact?: boolean
  transparent?: boolean
  className?: string
}) {
  const trackShare = useMutation(api.shares.track)

  const share = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    haptic()
    const url = shareUrl ? `${window.location.origin}${shareUrl}` : window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: title ?? 'Event Nu event', url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      /* sharing is best-effort */
    }
    try {
      await trackShare({ eventId: eventId as Id<'events'>, platform: 'native' })
    } catch {
      /* share tracking is best-effort */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this event"
      className={cn(cardActionButtonClass('hover:text-primary', compact, transparent), className)}
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

export function CardQuickActions({
  eventId,
  title,
  shareUrl,
  compact = false,
  transparent = false,
  likeCount,
  direction = 'column',
  className,
}: {
  eventId: string
  title?: string
  shareUrl?: string
  compact?: boolean
  transparent?: boolean
  /** Live like count rendered as a badge on the heart. Optimistic toggles patch it in place. */
  likeCount?: number
  /** 'column' keeps the classic vertical stack (hero); 'row' lays the actions out horizontally. */
  direction?: 'column' | 'row'
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Event actions"
      className={cn(
        'flex items-center rounded-full backdrop-blur-md',
        direction === 'row' ? 'flex-row' : 'flex-col',
        compact || transparent ? 'gap-0.5 bg-transparent p-0' : 'gap-xs bg-black/50 p-xs',
        className,
      )}
    >
      <CardLikeButton
        eventId={eventId}
        likeCount={likeCount}
        compact={compact}
        transparent={transparent}
      />
      <CardBookmarkButton eventId={eventId} compact={compact} transparent={transparent} />
      {title && (
        <CardShareButton
          eventId={eventId}
          title={title}
          shareUrl={shareUrl}
          compact={compact}
          transparent={transparent}
        />
      )}
    </div>
  )
}
