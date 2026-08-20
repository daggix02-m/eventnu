'use client'

import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Bookmark, Folder, MessageSquarePlus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EventCard } from '@/components/events/EventCard'
import { ExperiencePostCard } from '@/components/experiences/ExperiencePostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { mapEvent } from '@/lib/api/map-event'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import { VerificationReveal } from '@/components/verification/VerificationReveal'
import { BulkSocialProvider } from '@/components/social/EventSocialActions'

const SEEN_VERIFIED_KEY = 'eventnu_seen_verified'

export function ProfileClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<'bookmarks' | 'posts'>(() =>
    searchParams.get('tab') === 'posts' ? 'posts' : 'bookmarks',
  )
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const me = useQuery(api.profiles.getMe)
  const bookmarks = useQuery(api.bookmarks.listByUser)
  const folders = useQuery(api.bookmarks.listFolders, isAuthenticated ? {} : 'skip')
  const folderBookmarks = useQuery(
    api.bookmarks.listByFolder,
    isAuthenticated && selectedFolder !== 'all'
      ? selectedFolder === 'uncategorized'
        ? {}
        : { folderId: selectedFolder as Id<'bookmarkFolders'> }
      : 'skip',
  )
  const posts = useQuery(api.experiencePosts.listByUser, me ? { profileId: me._id } : 'skip')
  const [showReveal, setShowReveal] = useState(false)

  useEffect(() => {
    if (!me?.verified || !me.verifiedAt) return
    try {
      const seen = Number(localStorage.getItem(SEEN_VERIFIED_KEY) ?? '0')
      if (me.verifiedAt > seen) setShowReveal(true)
    } catch {
      /* storage unavailable */
    }
  }, [me?.verified, me?.verifiedAt])

  const handleRevealClose = () => {
    setShowReveal(false)
    try {
      localStorage.setItem(SEEN_VERIFIED_KEY, String(me?.verifiedAt ?? Date.now()))
    } catch {
      /* storage unavailable */
    }
  }

  useEffect(() => {
    const param = searchParams.get('tab')
    if (param === 'posts' || param === 'bookmarks') {
      setTab(param)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setTab(value as 'bookmarks' | 'posts')
    router.replace(`/profile?tab=${value}`)
  }

  const visibleBookmarks = selectedFolder === 'all' ? bookmarks : folderBookmarks

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
        <User className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="mt-sm font-display text-headline-md text-on-surface">
          Sign in to see your profile
        </h1>
        <p className="mt-xs font-body-md text-on-surface-variant">
          Save events you love and share your experiences.
        </p>
        <Button className="mt-lg" onClick={() => openAuth()}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-lg">
      <header className="flex flex-wrap items-center gap-md rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6 md:p-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 font-display text-headline-md text-primary">
          {(me?.fullName ?? 'U')
            .split(' ')
            .map((p: string) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-sm">
            <h1 className="font-display text-headline-md text-on-surface">
              {me?.fullName ?? 'Your profile'}
            </h1>
            {me?.verified && <VerifiedBadge />}
          </div>
          <p className="font-body-md text-on-surface-variant">{me?.email}</p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="bookmarks">
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            Saved events
          </TabsTrigger>
          <TabsTrigger value="posts">
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            My experiences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks">
          {folders && (
            <div className="mb-md flex flex-wrap gap-2" aria-label="Saved event folders">
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
              {folders.map(
                (folder: FunctionReturnType<typeof api.bookmarks.listFolders>[number]) => (
                  <button
                    key={folder._id}
                    type="button"
                    onClick={() => setSelectedFolder(folder._id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${selectedFolder === folder._id ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
                  >
                    <Folder className="h-3.5 w-3.5" /> {folder.name}
                  </button>
                ),
              )}
            </div>
          )}
          {visibleBookmarks === undefined ? (
            <div
              className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3"
              aria-hidden="true"
            >
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
        </TabsContent>

        <TabsContent value="posts">
          {posts === undefined ? (
            <div className="space-y-md" aria-hidden="true">
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : posts.length === 0 ? (
            <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8 md:p-xl text-center">
              <p className="font-display text-headline-md text-on-surface">No experiences yet</p>
              <p className="mt-xs font-body-md text-on-surface-variant">
                Share what it was like at a recent event — the community wants to know.
              </p>
              <Button asChild className="mt-lg">
                <a href="/experiences">
                  <MessageSquarePlus className="h-4 w-4" />
                  Share an experience
                </a>
              </Button>
            </div>
          ) : (
            <ul className="space-y-md">
              {posts.map(
                (post: FunctionReturnType<typeof api.experiencePosts.listByUser>[number]) => (
                  <li key={post.id}>
                    <ExperiencePostCard post={post} canDelete />
                  </li>
                ),
              )}
            </ul>
          )}
        </TabsContent>
      </Tabs>
      <VerificationReveal open={showReveal} onClose={handleRevealClose} />
    </div>
  )
}
