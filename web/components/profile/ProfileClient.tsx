'use client'

import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Bookmark, MessageSquarePlus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EventCard } from '@/components/events/EventCard'
import { ExperiencePostCard } from '@/components/experiences/ExperiencePostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthModal } from '@/components/auth/AuthModalContext'
import { mapEvent } from '@/lib/api/events'

export function ProfileClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthModal()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<'bookmarks' | 'posts'>(() =>
    searchParams.get('tab') === 'posts' ? 'posts' : 'bookmarks',
  )
  const me = useQuery(api.profiles.getMe)
  const bookmarks = useQuery(api.bookmarks.listByUser)
  const posts = useQuery(api.experiencePosts.listByUser, me ? { profileId: me._id } : 'skip')

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
      <div className="mx-auto w-full max-w-[28rem] rounded-xl border border-outline-variant bg-surface-container-low p-xl text-center">
        <User className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="mt-sm font-display text-headline-md text-on-surface">
          Sign in to see your profile
        </h1>
        <p className="mt-xs font-body-md text-on-surface-variant">
          Save events you love and share your experiences.
        </p>
        <Button className="mt-lg" onClick={openAuth}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-lg">
      <header className="flex flex-wrap items-center gap-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 font-display text-headline-md text-primary">
          {(me?.fullName ?? 'U')
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-headline-md text-on-surface">
            {me?.fullName ?? 'Your profile'}
          </h1>
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
          {bookmarks === undefined ? (
            <div
              className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3"
              aria-hidden="true"
            >
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-xl text-center">
              <p className="font-display text-headline-md text-on-surface">No saved events yet</p>
              <p className="mt-xs font-body-md text-on-surface-variant">
                Tap the bookmark icon on any event to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((event) => (
                <EventCard key={event._id as string} event={mapEvent(event)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts">
          {posts === undefined ? (
            <div className="space-y-md" aria-hidden="true">
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-xl text-center">
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
              {posts.map((post) => (
                <li key={post.id}>
                  <ExperiencePostCard post={post} canDelete />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
