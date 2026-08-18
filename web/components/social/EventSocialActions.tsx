'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Heart, Bookmark, Share2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/components/auth/AuthModalContext'
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
  const { openAuth } = useAuthModal()
  return { isAuthenticated, isLoading, openAuth }
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
  const toggle = useMutation(api.likes.toggle)
  const liked = useQuery(api.likes.hasLiked, { eventId: eventId as Id<'events'> })
  const count = useQuery(api.likes.countByEvent, { eventId: eventId as Id<'events'> })
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    setPending(true)
    try {
      await toggle({ eventId: eventId as Id<'events'> })
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
  const toggle = useMutation(api.bookmarks.toggle)
  const moveToFolder = useMutation(api.bookmarks.moveToFolder)
  const createFolder = useMutation(api.bookmarks.createFolder)
  const saved = useQuery(api.bookmarks.hasBookmarked, { eventId: eventId as Id<'events'> })
  const folders = useQuery(api.bookmarks.listFolders, isAuthenticated ? {} : 'skip')
  const [pending, setPending] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderPending, setFolderPending] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    setPending(true)
    try {
      const nextSaved = await toggle({ eventId: eventId as Id<'events'> })
      if (nextSaved) setShowFolderPicker(true)
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
            {folders?.map((folder) => (
              <button
                key={folder._id}
                type="button"
                onClick={() => void assignFolder(folder._id)}
                disabled={folderPending}
                className="w-full rounded-xl border border-outline-variant px-4 py-3 text-left text-on-surface transition-colors hover:border-primary hover:bg-surface-container-high"
              >
                {folder.name}
              </button>
            ))}
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

export function CardQuickActions({
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
  const { isAuthenticated, isLoading, openAuth } = useAuthGate()
  const toggleLike = useMutation(api.likes.toggle)
  const toggleBookmark = useMutation(api.bookmarks.toggle)
  const liked = useQuery(api.likes.hasLiked, { eventId: eventId as Id<'events'> })
  const saved = useQuery(api.bookmarks.hasBookmarked, { eventId: eventId as Id<'events'> })

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

  const share = async (e: React.MouseEvent) => {
    guard(e)
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
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-full backdrop-blur-md',
        compact || transparent ? 'gap-0.5 bg-transparent p-0' : 'gap-xs bg-black/50 p-xs',
        className,
      )}
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={(e) => handle(e, () => toggleLike({ eventId: eventId as Id<'events'> }))}
        disabled={isLoading}
        aria-pressed={!!liked}
        aria-label={liked ? 'Unlike this event' : 'Like this event'}
        className={cn(
          'rounded-full text-white transition-colors',
          compact || transparent ? 'hover:text-error' : 'hover:bg-white/10',
          compact ? 'p-1.5' : 'p-2',
        )}
      >
        <Heart
          className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', liked && 'fill-error text-error')}
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        onClick={(e) => handle(e, () => toggleBookmark({ eventId: eventId as Id<'events'> }))}
        disabled={isLoading}
        aria-pressed={!!saved}
        aria-label={saved ? 'Remove from saved events' : 'Save this event'}
        className={cn(
          'rounded-full text-white transition-colors',
          compact || transparent ? 'hover:text-primary' : 'hover:bg-white/10',
          compact ? 'p-1.5' : 'p-2',
        )}
      >
        <Bookmark
          className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', saved && 'fill-primary text-primary')}
          aria-hidden="true"
        />
      </button>
      {title && (
        <button
          type="button"
          onClick={share}
          aria-label="Share this event"
          className={cn(
            'rounded-full text-white transition-colors',
            compact || transparent ? 'hover:text-primary' : 'hover:bg-white/10',
            compact ? 'p-1.5' : 'p-2',
          )}
        >
          <Share2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
