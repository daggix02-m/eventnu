'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Bookmark, Folder, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/cards/EventCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { mapEvent } from '@/lib/api/map-event'
import { BulkSocialProvider } from '@/components/social/EventSocialActions'

export function SavedEventsClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const bookmarks = useQuery(api.bookmarks.listByUser, isAuthenticated ? {} : 'skip')
  const folders = useQuery(api.bookmarks.listFolders, isAuthenticated ? {} : 'skip')
  const folderBookmarks = useQuery(
    api.bookmarks.listByFolder,
    isAuthenticated && selectedFolder !== 'all'
      ? selectedFolder === 'uncategorized'
        ? {}
        : { folderId: selectedFolder as Id<'bookmarkFolders'> }
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

  const visibleBookmarks = selectedFolder === 'all' ? bookmarks : folderBookmarks

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-lg">
      <header className="space-y-sm">
        <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Saved events
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Your saved events, organized into folders.
        </p>
      </header>

      {folders && (
        <div className="flex flex-wrap gap-2" aria-label="Saved event folders">
          <button
            type="button"
            onClick={() => setSelectedFolder('all')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${selectedFolder === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
          >
            <Bookmark className="h-3.5 w-3.5" /> All saved
          </button>
          <button
            type="button"
            onClick={() => setSelectedFolder('uncategorized')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${selectedFolder === 'uncategorized' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
          >
            Uncategorized
          </button>
          {folders.map((folder: FunctionReturnType<typeof api.bookmarks.listFolders>[number]) => (
            <button
              key={folder._id}
              type="button"
              onClick={() => setSelectedFolder(folder._id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${selectedFolder === folder._id ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
            >
              <Folder className="h-3.5 w-3.5" /> {folder.name}
            </button>
          ))}
        </div>
      )}

      {visibleBookmarks === undefined ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : visibleBookmarks.length === 0 ? (
        <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8 md:p-xl text-center">
          <p className="font-display text-headline-md text-on-surface">No saved events yet</p>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Tap the bookmark icon on any event to save it here.
          </p>
        </div>
      ) : (
        <BulkSocialProvider
          eventIds={visibleBookmarks.map(
            (event: FunctionReturnType<typeof api.bookmarks.listByFolder>[number]) =>
              event._id as string,
          )}
        >
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {visibleBookmarks.map(
              (event: FunctionReturnType<typeof api.bookmarks.listByFolder>[number]) => (
                <EventCard key={event._id as string} event={mapEvent(event)} />
              ),
            )}
          </div>
        </BulkSocialProvider>
      )}
    </div>
  )
}
