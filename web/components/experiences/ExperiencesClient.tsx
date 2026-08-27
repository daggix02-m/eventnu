'use client'

import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useConvexAuth } from '@convex-dev/auth/react'
import { CreateExperienceForm } from '@/components/experiences/CreateExperienceForm'
import { ExperiencePostCard } from '@/components/experiences/ExperiencePostCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { FunctionReturnType } from 'convex/server'

export function ExperiencesClient({ eventSlug }: { eventSlug?: string }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const me = useQuery(api.profiles.getMe)
  const posts = useQuery(api.experiencePosts.listByUser, me ? { profileId: me._id } : 'skip')
  const events = useQuery(api.events.read.getPublished)

  const preselectedEvent = events?.find(
    (e: FunctionReturnType<typeof api.events.read.getPublished>[number]) => e.slug === eventSlug,
  )
  const initialEventId = preselectedEvent?._id

  return (
    <div className="mx-auto w-full max-w-[42rem] space-y-xl">
      <header className="space-y-sm">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface">
          My experiences
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Real stories from real events — share what you saw, heard, and felt.
        </p>
      </header>

      {!authLoading && isAuthenticated && (
        <CreateExperienceForm
          initialEventId={eventSlug ? initialEventId : undefined}
          eventTitle={preselectedEvent?.title}
        />
      )}

      <section className="space-y-md" aria-label="My experiences">
        <h2 className="font-display text-headline-md text-on-surface">My experiences</h2>

        {posts === undefined ? (
          <div className="space-y-md" aria-hidden="true">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : posts.length === 0 ? (
          <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8 md:p-xl text-center">
            <p className="font-display text-headline-md text-on-surface">No experiences yet</p>
            <p className="mt-xs text-body-md text-on-surface-variant">
              Share what it was like at a recent event — the community wants to know.
            </p>
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
      </section>
    </div>
  )
}
