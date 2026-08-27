import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  ExternalLink,
  Ticket,
  ChevronRight,
  Sparkles,
  Compass,
} from 'lucide-react'
import { formatEventDate, formatEventDateShort, isEventPast, isSafeUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EventGallery } from '@/components/events/detail/EventGallery'
import { hasGallery } from '@/lib/media'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import { ReportDialog } from '@/components/moderation/ReportDialog'
import { BackButton } from '@/components/layout/BackButton'
import { CardQuickActions } from '@/components/social/EventSocialActions'
import type { Event } from '@/types'

interface EventHeroProps {
  event: Event
}

export interface HeroCta {
  kind: 'ended' | 'external' | 'reservation' | null
  label: string
  href?: string
}

/**
 * Decide what primary action the hero should offer for an event.
 *
 * `kind === null` means there is no actionable CTA (no external link and no
 * reservation flow) — the hero should not render a button at all.
 *
 * Kept as a pure function so both the desktop hero CTA and the mobile sticky
 * bar render from the exact same decision, and so the logic is unit-testable.
 */
export function getHeroCta(event: Event): HeroCta {
  if (isEventPast(event.start_date)) return { kind: 'ended', label: 'Event Ended' }

  const externalLabel =
    event.external_link_label?.trim() || (event.is_free ? 'More Info' : 'Get Tickets')
  if (event.external_link && isSafeUrl(event.external_link)) {
    return { kind: 'external', label: externalLabel, href: event.external_link }
  }

  if (event.action_type === 'reservation') {
    return { kind: 'reservation', label: 'Reserve a Spot', href: '#reserve' }
  }

  return { kind: null, label: '' }
}

function HeroCtaButton({ cta, className }: { cta: HeroCta; className?: string }) {
  if (cta.kind === 'ended') {
    return (
      <Button disabled size="lg" className={cn('min-w-[180px] rounded-xl font-bold', className)}>
        Event Ended
      </Button>
    )
  }

  if (cta.kind === 'external' && cta.href) {
    return (
      <Button
        asChild
        size="lg"
        className={cn(
          'min-w-[180px] rounded-xl font-bold gap-2 shadow-lg shadow-black/40',
          className,
        )}
      >
        <a href={cta.href} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4" />
          <span>{cta.label}</span>
        </a>
      </Button>
    )
  }

  if (cta.kind === 'reservation' && cta.href) {
    return (
      <Button
        asChild
        size="lg"
        className={cn(
          'min-w-[180px] rounded-xl font-bold gap-2 shadow-lg shadow-black/40',
          className,
        )}
      >
        <a href={cta.href}>
          <Ticket className="w-4 h-4" />
          <span>{cta.label}</span>
        </a>
      </Button>
    )
  }

  return null
}

function getPrimaryCategory(event: Event) {
  return (
    event.event_categories?.find((ec) => ec.is_primary)?.categories ??
    event.event_categories?.[0]?.categories
  )
}

export function EventHero({ event }: EventHeroProps) {
  const category = getPrimaryCategory(event)
  const cta = getHeroCta(event)
  const showGallery = hasGallery(event.images)

  return (
    <section className="relative w-full overflow-hidden bg-surface-container-lowest border-b border-outline-variant/30">
      {/* Background Poster / Gallery Media / Stylish Fallback */}
      <div className="relative w-full min-h-[380px] sm:min-h-[460px] md:min-h-[540px] lg:min-h-[600px] flex flex-col justify-between">
        {showGallery ? (
          <div className="absolute inset-0 z-0">
            <EventGallery event={event} variant="hero" className="w-full h-full" />
          </div>
        ) : event.poster_url ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={event.poster_url}
              alt={event.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            {/* Cinematic Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#151318] via-[#151318]/70 to-[#151318]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#151318]/90 via-[#151318]/40 to-transparent hidden md:block" />
          </div>
        ) : (
          /* High-end decorative background when no poster is uploaded */
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1e1927] via-[#151318] to-[#0d0c10] overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d0bcff_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 -mb-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
          </div>
        )}

        <CardQuickActions
          eventId={event.id}
          title={event.title}
          shareUrl={`/events/${event.slug}`}
          likeCount={event.like_count}
          transparent
          className="absolute bottom-8 right-4 z-30 sm:right-8"
        />

        {/* Top Breadcrumb & Status Bar */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex items-center justify-between pointer-events-auto">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80"
          >
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Discover</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-white/40" />
            <Link href="/schedule" className="hover:text-primary transition-colors">
              Events
            </Link>
            {category && (
              <>
                <ChevronRight className="w-3 h-3 text-white/40" />
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-primary hover:underline truncate max-w-[180px]"
                  title={category.name}
                >
                  {category.name}
                </Link>
              </>
            )}
          </nav>

          {/* Status & Date Badges */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Visible back control on mobile — iOS standalone PWAs have no
                browser chrome, so without this a phone user on a detail page
                has no way back except the home logo. */}
            <span className="sm:hidden">
              <BackButton />
            </span>
            <ReportDialog targetType="event" targetId={event.id} />
            {cta.kind === 'ended' ? (
              <span className="bg-error text-on-error font-mono text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Event Ended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Upcoming
              </span>
            )}
            <span className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full font-mono text-[11px] text-white font-medium">
              {formatEventDateShort(event.start_date)}
            </span>
          </div>
        </div>

        {/* Hero Bottom Content Overlay */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-16 sm:pb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            {/* Event Title & Key Metadata */}
            <div className="space-y-3.5 max-w-[54rem]">
              {category && (
                <Badge
                  variant="default"
                  className="text-xs font-mono font-bold tracking-wider uppercase px-3 py-1 rounded-lg"
                >
                  {category.name}
                </Badge>
              )}

              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
                {event.title}
              </h1>

              {event.subtitle && (
                <p className="text-sm sm:text-base md:text-lg text-on-surface-variant font-medium leading-relaxed max-w-[42rem]">
                  {event.subtitle}
                </p>
              )}

              {/* Quick Meta Chips */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs sm:text-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high/90 backdrop-blur-md border border-outline-variant/50 text-on-surface">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">{formatEventDate(event.start_date)}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high/90 backdrop-blur-md border border-outline-variant/50 text-on-surface">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-none">
                    {event.venue_name}
                    {event.venue_address ? `, ${event.venue_address}` : ''}
                  </span>
                </div>

                {event.organizer?.full_name && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high/90 backdrop-blur-md border border-outline-variant/50 text-on-surface-variant">
                    <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span>
                      Host:{' '}
                      {event.organizer.handle ? (
                        <Link
                          href={`/organizer/${event.organizer.handle}`}
                          className="text-on-surface font-semibold hover:text-primary"
                        >
                          {event.organizer.full_name}
                        </Link>
                      ) : (
                        <strong className="text-on-surface font-semibold">
                          {event.organizer.full_name}
                        </strong>
                      )}
                    </span>
                    {event.organizer.verified && <VerifiedBadge compact />}
                  </div>
                )}
              </div>
            </div>

            {/* Action CTA Button on Hero (Desktop) */}
            <div className="hidden md:flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <HeroCtaButton cta={cta} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only sticky action bar — the primary ticket/reserve CTA must
          be reachable on a phone without scrolling through the whole page. */}
      {cta.kind && (
        <div className="fixed bottom-[calc(var(--keyboard-inset,0px)_+_5.5rem_+_env(safe-area-inset-bottom))] inset-x-0 z-50 md:hidden px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-[32rem] mx-auto">
            <HeroCtaButton cta={cta} className="w-full min-w-0" />
          </div>
        </div>
      )}
    </section>
  )
}
