'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Bookmark, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SavedEventRow } from '@/components/saved/SavedEventRow'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { mapEvent } from '@/lib/api/map-event'
import { BulkSocialProvider } from '@/components/social/EventSocialActions'
import { cn } from '@/lib/utils'

type Folder = FunctionReturnType<typeof api.bookmarks.listFolders>[number]

export function SavedEventsClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const [selected, setSelected] = useState<string>('all')
  const bookmarks = useQuery(api.bookmarks.listByUser, isAuthenticated ? {} : 'skip')
  const folders = useQuery(api.bookmarks.listFolders, isAuthenticated ? {} : 'skip')
  const folderBookmarks = useQuery(
    api.bookmarks.listByFolder,
    isAuthenticated && selected !== 'all'
      ? selected === 'uncategorized'
        ? {}
        : { folderId: selected as Id<'bookmarkFolders'> }
      : 'skip',
  )

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-[52rem] space-y-lg" aria-hidden="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8 md:p-xl text-center">
        <Bookmark className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="mt-sm font-display text-headline-md text-on-surface">
          Sign in to see your saved events
        </h1>
        <p className="mt-xs font-body-md text-on-surface-variant">
          Save events you love and come back to them anytime.
        </p>
        <Button className="mt-lg" onClick={() => openAuth('/saved')}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </div>
    )
  }

  const visibleBookmarks = selected === 'all' ? bookmarks : folderBookmarks
  const folderName = (folderId?: string) =>
    folderId ? (folders ?? []).find((f) => f._id === folderId)?.name : null

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-lg">
      <header className="space-y-sm">
        <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Saved events
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Your saved events, organized by category.
        </p>
      </header>

      {/* Category filter rail */}
      {folders && (
        <nav
          aria-label="Saved event categories"
          className="-mx-4 flex gap-2 overflow-x-auto scrollbar-none px-4 pb-1 md:mx-0 md:px-0"
        >
          <button
            type="button"
            onClick={() => setSelected('all')}
            aria-pressed={selected === 'all'}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
              selected === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
            )}
          >
            <Bookmark className="h-3.5 w-3.5" /> All saved
          </button>
          <button
            type="button"
            onClick={() => setSelected('uncategorized')}
            aria-pressed={selected === 'uncategorized'}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
              selected === 'uncategorized'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
            )}
          >
            Uncategorized
          </button>
          {folders.map((folder: Folder) => (
            <button
              key={folder._id}
              type="button"
              onClick={() => setSelected(folder._id)}
              aria-pressed={selected === folder._id}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
                selected === folder._id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
              )}
            >
              {folder.emoji ?? <Bookmark className="h-3.5 w-3.5" />} {folder.name}
            </button>
          ))}
        </nav>
      )}

      {visibleBookmarks === undefined ? (
        <div className="space-y-2" aria-hidden="true">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : visibleBookmarks.length === 0 ? (
        <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8 md:p-xl text-center">
          <p className="font-display text-headline-md text-on-surface">No saved events here yet</p>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Tap the bookmark icon on any event to save it to this category.
          </p>
        </div>
      ) : (
        <BulkSocialProvider eventIds={visibleBookmarks.map((event) => event._id as string)}>
          <ul className="space-y-2">
            {visibleBookmarks.map((event) => (
              <li key={event._id as string}>
                <SavedEventRow
                  event={mapEvent(event)}
                  categoryName={folderName((event as { folderId?: string }).folderId)}
                />
              </li>
            ))}
          </ul>
        </BulkSocialProvider>
      )}
    </div>
  )
}
