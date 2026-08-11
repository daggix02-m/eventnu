'use client'

import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useConvexAuth } from '@convex-dev/auth/react'
import { CreateExperienceForm } from '@/components/experiences/CreateExperienceForm'
import { ExperiencePostCard } from '@/components/experiences/ExperiencePostCard'
import { Skeleton } from '@/components/ui/skeleton'

export function ExperiencesClient({ eventSlug }: { eventSlug?: string }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const posts = useQuery(api.experiencePosts.listRecent, { limit: 30 })
  const me = useQuery(api.profiles.getMe)
  const events = useQuery(api.events.getPublished)

  const preselectedEvent = events?.find((e) => e.slug === eventSlug)
  const initialEventId = preselectedEvent?._id as any

  return (
    <div className="mx-auto w-full max-w-[42rem] space-y-xl">
      <header className="space-y-sm">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface">
          Experiences
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

      <section className="space-y-md" aria-label="Recent experiences">
        <h2 className="font-display text-headline-md text-on-surface">Recent from the community</h2>

        {posts === undefined ? (
          <div className="space-y-md" aria-hidden="true">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-xl text-center">
            <p className="font-display text-headline-md text-on-surface">No experiences yet</p>
            <p className="mt-xs text-body-md text-on-surface-variant">
              Be the first to share what it was like at an Event Nu event.
            </p>
          </div>
        ) : (
          <ul className="space-y-md">
            {posts.map((post) => (
              <li key={post.id}>
                <ExperiencePostCard post={post} canDelete={post.userId === me?._id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
