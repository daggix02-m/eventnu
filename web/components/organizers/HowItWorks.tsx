'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { PenLine, Rocket, Scan, Banknote } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const STEPS = [
  {
    icon: PenLine,
    title: 'Draft & Customize',
    body: 'Fill in your event details, select categories, upload high-res poster flyers, and configure your ticket tiers in minutes.',
    time: '~2 min',
    accent: 'text-primary',
    accentBg: 'bg-primary/10 border-primary/30',
  },
  {
    icon: Rocket,
    title: 'Publish & Promote',
    body: "Go live in the Event Nu marketplace. Active buyers matching your event's profile are notified via push notifications and digest emails automatically.",
    time: 'instant',
    accent: 'text-secondary',
    accentBg: 'bg-secondary/10 border-secondary/30',
  },
  {
    icon: Scan,
    title: 'Scan & Validate',
    body: 'Download the Event Nu Organizer App. Scan QR codes at the gate, validate entries in real-time, and sync across multiple devices even offline.',
    time: 'door-time',
    accent: 'text-tertiary',
    accentBg: 'bg-tertiary/10 border-tertiary/30',
  },
  {
    icon: Banknote,
    title: 'Request Payout',
    body: 'After your event, request your settlement with a single tap. Revenue is deposited directly to your CBE or Telebirr account within 24–48 hours.',
    time: '24–48 hrs',
    accent: 'text-primary',
    accentBg: 'bg-primary/10 border-primary/30',
  },
] as const

export function OrganizersHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.2,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: timelineRef.current,
              start: 'top 75%',
              end: 'bottom 60%',
              scrub: 1.5,
            },
          },
        )
      }

      if (timelineRef.current) {
        const stepItems = timelineRef.current.querySelectorAll('.step-item')
        if (stepItems.length) {
          gsap.fromTo(
            stepItems,
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.45,
              stagger: 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: timelineRef.current,
                start: 'top 70%',
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
      id="how-it-works"
      ref={sectionRef}
      className="relative z-10 py-xl md:py-2xl border-t border-outline-variant/30 scroll-mt-16"
    >
      <Container>
        <div
          ref={headerRef}
          className="text-center max-w-[48rem] mx-auto mb-12 space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            From idea to sold-out in four steps
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg md:text-xl leading-relaxed">
            Our streamlined organizer flow makes listing fast, promotion automatic, and settlement
            reliable.
          </p>
        </div>

        <div ref={timelineRef} className="relative max-w-[48rem] mx-auto">
          {/* Vertical connecting line */}
          <div
            ref={lineRef}
            className="absolute left-7 top-7 bottom-7 w-[2px] bg-outline-variant/40 origin-top"
            aria-hidden="true"
          />

          <div className="space-y-md">
            {STEPS.map((step, idx) => (
              <div key={idx} className="step-item relative flex items-start gap-lg opacity-0">
                {/* Step number node */}
                <div
                  className={`relative z-10 w-14 h-14 rounded-xl border flex-col items-center justify-center shrink-0 flex ${step.accentBg}`}
                  aria-hidden="true"
                >
                  <span
                    className={`font-display text-[11px] font-bold ${step.accent} leading-none mb-0.5 opacity-60`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <step.icon className={`w-5 h-5 ${step.accent}`} />
                </div>

                {/* Step card */}
                <div className="flex-1 glass-card border border-outline-variant/30 rounded-2xl p-md md:p-lg hover:border-primary/25 hover:bg-surface-container/50 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-xs">
                    <h3 className="font-display text-[18px] md:text-[20px] font-bold text-white">
                      {step.title}
                    </h3>
                    <span
                      className={`ml-md shrink-0 px-xs py-0.5 rounded-full border font-mono text-[10px] font-semibold ${step.accentBg} ${step.accent}`}
                    >
                      {step.time}
                    </span>
                  </div>
                  <p className="text-on-surface text-body-md leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
