import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { CalendarDays, Globe, Users, MapPin } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import { getOrganizerByHandle } from '@/lib/api/organizers'
import { ReportDialog } from '@/components/moderation/ReportDialog'

export const metadata: Metadata = {
  title: 'Organizer | Event Nu',
  description: 'Events listed by this organizer on Event Nu.',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const organizer = await getOrganizerByHandle(handle)

  if (!organizer) {
    notFound()
  }

  const initials = (organizer.name || 'O').slice(0, 2).toUpperCase()

  return (
    <Container className="py-lg">
      <div className="mx-auto w-full max-w-[52rem] space-y-lg">
        {/* Header */}
        <header className="flex flex-col gap-md rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:flex-row sm:items-start sm:p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-highest">
            {organizer.logoUrl ? (
              <Image
                src={organizer.logoUrl}
                alt={organizer.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-headline-md text-primary">{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-sm">
              <h1 className="font-display text-display-md text-on-surface">{organizer.name}</h1>
              {organizer.verified && <VerifiedBadge />}
            </div>
            {organizer.handle && (
              <p className="font-mono text-label-sm text-on-surface-variant">@{organizer.handle}</p>
            )}
            {organizer.bio && (
              <p className="mt-sm max-w-[42rem] text-body-md text-on-surface-variant">
                {organizer.bio}
              </p>
            )}
            <div className="mt-md flex flex-wrap items-center gap-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-primary" />
                {organizer.followerCount} followers
              </span>
              {organizer.website && (
                <a
                  href={organizer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
            <div className="mt-sm">
              <ReportDialog targetType="organizer" targetId={organizer.id} />
            </div>
          </div>
        </header>

        {/* Events */}
        <section>
          <h2 className="font-display text-headline-md text-on-surface">Events</h2>
          {organizer.events.length === 0 ? (
            <p className="mt-sm rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center text-body-md text-on-surface-variant">
              No upcoming events yet.
            </p>
          ) : (
            <ul className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2">
              {organizer.events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={event.slug ? `/events/${event.slug}` : '#'}
                    className="flex gap-md rounded-2xl border border-outline-variant bg-surface-container-low p-3 transition-colors hover:border-primary/60"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-highest">
                      {event.posterUrl ? (
                        <Image
                          src={event.posterUrl}
                          alt={event.title}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CalendarDays className="h-6 w-6 text-on-surface-variant" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium text-on-surface">{event.title}</p>
                      <p className="mt-1 flex items-center gap-1 font-mono text-label-sm text-on-surface-variant">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(event.startDate)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-body-md text-on-surface-variant">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {event.venueName}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  )
}
