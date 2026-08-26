'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { Wallet, Search, BarChart3, CreditCard } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const PILLARS = [
  {
    icon: Wallet,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/25',
    title: 'Instant Ticketing',
    body: 'Set up free or paid events in under 60 seconds. Configure tiers, upload your poster, and go live with zero technical friction.',
    featured: true,
    tags: ['Free events', 'Paid tiers', 'Live in 60s', 'Custom poster'],
  },
  {
    icon: Search,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10 border-secondary/25',
    title: 'Algorithmic Discovery',
    body: 'Your events appear for people searching by interest and location in Addis Ababa.',
    featured: false,
  },
  {
    icon: CreditCard,
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary/10 border-tertiary/25',
    title: 'Local Payment Gateways',
    body: 'Accept Telebirr, CBE Birr, Chapa, and international cards. Every checkout method your audience already uses.',
    featured: false,
  },
  {
    icon: BarChart3,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/25',
    title: 'Real-Time Analytics',
    body: 'Insights into ticket buyer origins, demographics, referral pathways, and payout logs—all in one real-time cockpit.',
    featured: false,
  },
] as const

export function OrganizersValuePillars() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.querySelectorAll('.pillar-card'),
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: { each: 0.08 },
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

  const featuredPillar = PILLARS.find((p) => p.featured)!
  const regularPillars = PILLARS.filter((p) => !p.featured)

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl border-t border-outline-variant/20">
      <Container>
        <div className="text-center max-w-[48rem] mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Powerful tools built for every Addis event creator
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg md:text-xl leading-relaxed">
            From intimate art nights to large-scale concerts — everything you need in one place.
          </p>
        </div>

        {/* Bento grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md auto-rows-auto"
        >
          {/* Featured card */}
          <div
            className={`pillar-card md:col-span-2 lg:col-span-2 relative p-lg md:p-xl bg-surface-container-low/70 border border-outline-variant/40 rounded-2xl flex flex-col gap-md hover:border-outline-variant/80 hover:bg-surface-container/60 transition-all duration-300 group opacity-0`}
          >
            <div className="flex items-start gap-lg">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ${featuredPillar.iconBg}`}
              >
                <featuredPillar.icon
                  className={`w-7 h-7 ${featuredPillar.iconColor}`}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-[22px] md:text-[25px] font-bold text-white mb-xs">
                  {featuredPillar.title}
                </h3>
                <p className="text-on-surface-variant text-body-lg leading-relaxed">
                  {featuredPillar.body}
                </p>
              </div>
            </div>

            {/* Feature highlights row */}
            <div className="flex flex-wrap gap-xs pt-sm border-t border-outline-variant/20">
              {featuredPillar.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-surface-container-high border border-outline-variant/30 font-mono text-[11px] text-on-surface"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Regular cards */}
          {regularPillars.map((pillar) => (
            <div
              key={pillar.title}
              className={`pillar-card relative p-lg bg-surface-container-low/70 border border-outline-variant/40 rounded-2xl flex flex-col hover:border-outline-variant/80 hover:bg-surface-container/60 transition-all duration-300 group opacity-0`}
            >
              <div className="space-y-md">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ${pillar.iconBg}`}
                >
                  <pillar.icon className={`w-6 h-6 ${pillar.iconColor}`} aria-hidden="true" />
                </div>
                <h3 className="font-display text-[18px] font-bold text-white">{pillar.title}</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
