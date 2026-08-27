'use client'

import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, MessageSquarePlus, Settings, Bookmark, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExperiencePostCard } from '@/components/experiences/ExperiencePostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import { VerificationReveal } from '@/components/verification/VerificationReveal'
import { ProfileStories } from '@/components/profile/ProfileStories'
import { ProfilePastEventsContainer as ProfilePastEvents } from '@/components/profile/ProfilePastEvents'
import { cn } from '@/lib/utils'

const SEEN_VERIFIED_KEY = 'eventnu_seen_verified'

type ProfileTab = 'experiences' | 'stories' | 'past'

function isProfileTab(value: string | null): value is ProfileTab {
  return value === 'experiences' || value === 'stories' || value === 'past'
}

function SegmentedTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-surface-container-high text-on-surface shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

export function ProfileClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const searchParams = useSearchParams()
  const router = useRouter()
  const me = useQuery(api.profiles.getMe)
  const posts = useQuery(api.experiencePosts.listByUser, me ? { profileId: me._id } : 'skip')
  const [showReveal, setShowReveal] = useState(false)
  const [tab, setTab] = useState<ProfileTab>(() =>
    isProfileTab(searchParams.get('tab')) ? (searchParams.get('tab') as ProfileTab) : 'experiences',
  )

  const selectTab = (next: ProfileTab) => {
    setTab(next)
    if (next === 'experiences') {
      router.replace('/profile', { scroll: false })
    } else {
      router.replace(`/profile?tab=${next}`, { scroll: false })
    }
  }

  // Legacy alias: /profile?tab=bookmarks moved to its own /saved page.
  useEffect(() => {
    if (searchParams.get('tab') === 'bookmarks') {
      router.replace('/saved')
    }
  }, [searchParams, router])

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
        <MessageSquarePlus className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="mt-sm font-display text-headline-md text-on-surface">
          Sign in to see your profile
        </h1>
        <p className="mt-xs font-body-md text-on-surface-variant">
          Share your experiences and manage your account.
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
        <Button asChild variant="outline" size="sm" className="min-h-11">
          <a href="/profile/settings">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Edit profile
          </a>
        </Button>
      </header>

      {/* Stories / Past Events / Experiences hub */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex gap-1 rounded-2xl border border-outline-variant bg-surface-container-low p-1"
      >
        <SegmentedTab
          active={tab === 'experiences'}
          onClick={() => selectTab('experiences')}
          icon={<MessageSquarePlus className="h-4 w-4" aria-hidden="true" />}
          label="Experiences"
        />
        <SegmentedTab
          active={tab === 'stories'}
          onClick={() => selectTab('stories')}
          icon={<Camera className="h-4 w-4" aria-hidden="true" />}
          label="My Stories"
        />
        <SegmentedTab
          active={tab === 'past'}
          onClick={() => selectTab('past')}
          icon={<Bookmark className="h-4 w-4" aria-hidden="true" />}
          label="Past Events"
        />
      </div>

      {tab === 'stories' && (
        <section className="space-y-md" aria-label="My stories">
          <h2 className="font-display text-headline-md text-on-surface">My stories</h2>
          <ProfileStories />
        </section>
      )}

      {tab === 'past' && (
        <section className="space-y-md" aria-label="My past events">
          <h2 className="font-display text-headline-md text-on-surface">Past events</h2>
          <p className="font-body-sm text-on-surface-variant">
            Stories that passed their 24 hours live here — only you can see them.
          </p>
          <ProfilePastEvents />
        </section>
      )}

      {tab === 'experiences' && (
        <section className="space-y-md" aria-label="My experiences">
          <h2 className="font-display text-headline-md text-on-surface">My experiences</h2>

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
        </section>
      )}

      <VerificationReveal open={showReveal} onClose={handleRevealClose} />
    </div>
  )
}
