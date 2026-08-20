'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { ArrowRight, Ticket } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { EventCard } from '@/components/events/cards/EventCard'
import { BulkSocialProvider } from '@/components/social/EventSocialActions'
import type { Event } from '@/types'

interface OrganizersShowcaseProps {
  contactUrl: string
  events: Event[]
}

export function OrganizersShowcase({ contactUrl, events }: OrganizersShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          },
        )
      }
    },
    { scope: sectionRef },
  )

  const showcaseEvents = [...events]
    .sort((a, b) => b.created_at?.localeCompare(a.created_at ?? '') ?? 0)
    .slice(0, 6)

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-2xl border-t border-outline-variant/30 bg-surface-container-lowest/30 overflow-hidden"
    >
      <Container>
        <div ref={headerRef} className="text-center max-w-[48rem] mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your events, found across the city.
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg md:text-xl leading-relaxed">
            Everything you publish appears on the homepage, category pages, and search — alongside
            the real events of Addis Ababa. This is where your listings live today.
          </p>
        </div>

        {showcaseEvents.length > 0 ? (
          <BulkSocialProvider eventIds={showcaseEvents.map((event) => event.id)}>
            <div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md max-w-[64rem] mx-auto"
            >
              {showcaseEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </BulkSocialProvider>
        ) : (
          <div className="flex flex-col items-center text-center gap-sm py-xl">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
              <Ticket className="w-8 h-8 text-on-surface-variant" aria-hidden="true" />
            </div>
            <p className="text-on-surface-variant text-body-lg">
              Events listed on Event Nu will appear here.
            </p>
          </div>
        )}

        <div className="text-center mt-xl">
          <Link
            href={contactUrl}
            className="inline-flex items-center gap-xs text-primary font-bold text-body-lg hover:underline underline-offset-4"
          >
            List your event &mdash; free
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}
