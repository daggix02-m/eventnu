'use client'

import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import type { FunctionReturnType } from 'convex/server'
import { ExperiencePostCard } from '@/components/experiences/ExperiencePostCard'
import { Skeleton } from '@/components/ui/skeleton'

export function ExperiencePostsManager({ profileId }: { profileId: Id<'profiles'> }) {
  const posts = useQuery(api.experiencePosts.listByUser, { profileId })

  return (
    <div className="space-y-md">
      <div>
        <h2 className="font-display text-headline-sm text-on-surface">My experience posts</h2>
        <p className="font-body-sm text-on-surface-variant">
          Delete a post to remove it from the community feed.
        </p>
      </div>

      {posts === undefined ? (
        <div className="space-y-md" aria-hidden="true">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-md text-center">
          <p className="font-body-md text-on-surface-variant">
            You haven&apos;t shared any experiences yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-md">
          {posts.map((post: FunctionReturnType<typeof api.experiencePosts.listByUser>[number]) => (
            <li key={post.id}>
              <ExperiencePostCard post={post} canDelete />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
