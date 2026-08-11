'use client'

import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { Users, Calendar, Star, Banknote, MapPin, Palette } from 'lucide-react'
import { Container } from '@/components/layout/Container'

export interface OrganizerStat {
  value: number
  prefix?: string
  suffix?: string
  label: string
  description: string
  icon: 'users' | 'calendar' | 'star' | 'banknote' | 'map-pin' | 'palette'
}

const ICON_STYLES: Record<
  OrganizerStat['icon'],
  { icon: typeof Users; color: string; iconBg: string }
> = {
  users: { icon: Users, color: 'text-primary', iconBg: 'bg-primary/10 border-primary/20' },
  calendar: {
    icon: Calendar,
    color: 'text-secondary',
    iconBg: 'bg-secondary/10 border-secondary/20',
  },
  star: { icon: Star, color: 'text-tertiary', iconBg: 'bg-tertiary/10 border-tertiary/20' },
  banknote: { icon: Banknote, color: 'text-primary', iconBg: 'bg-primary/10 border-primary/20' },
  'map-pin': {
    icon: MapPin,
    color: 'text-secondary',
    iconBg: 'bg-secondary/10 border-secondary/20',
  },
  palette: { icon: Palette, color: 'text-tertiary', iconBg: 'bg-tertiary/10 border-tertiary/20' },
}

function AnimatedCounter({
  target,
  suffix,
  prefix,
}: {
  target: number
  suffix: string
  prefix: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    tweenRef.current = gsap.to(
      {},
      {
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
          toggleActions: 'play none none reset',
        },
        onUpdate() {
          if (tweenRef.current) {
            const progress = tweenRef.current.progress()
            setCount(Math.round(target * Math.min(progress, 1)))
          }
        },
      },
    )
    return () => {
      tweenRef.current?.kill()
    }
  }, [target])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

interface OrganizersStatBandProps {
  stats: OrganizerStat[]
}

export function OrganizersStatBand({ stats }: OrganizersStatBandProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (sectionRef.current) {
        const statItems = sectionRef.current.querySelectorAll('.stat-item')
        if (statItems.length) {
          gsap.fromTo(
            statItems,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            },
          )
        }
      }
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-xl border-y border-outline-variant/30 overflow-hidden"
      aria-label="Platform statistics"
    >
      {/* Radial background */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/60 via-surface/20 to-surface-container-lowest/60 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm md:gap-md">
          {stats.map((stat) => {
            const { icon: Icon, color, iconBg } = ICON_STYLES[stat.icon]
            return (
              <div
                key={stat.label}
                className="stat-item group relative flex flex-col items-center text-center p-md rounded-2xl bg-surface-container/20 border border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container/40 transition-all duration-300 opacity-0"
              >
                <div
                  className="absolute inset-0 rounded-2xl bg-primary/4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className={`relative z-10 w-12 h-12 rounded-xl border flex items-center justify-center mb-md ${iconBg}`}
                >
                  <Icon className={`w-6 h-6 ${color}`} aria-hidden="true" />
                </div>
                <h3
                  className={`relative z-10 font-display text-[36px] md:text-[44px] font-extrabold leading-none ${color}`}
                >
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix ?? ''}
                    prefix={stat.prefix ?? ''}
                  />
                </h3>
                <p className="relative z-10 font-display text-[13px] font-bold text-white mt-xs mb-xs">
                  {stat.label}
                </p>
                <p className="relative z-10 font-mono text-[11px] text-on-surface-variant leading-relaxed">
                  {stat.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
