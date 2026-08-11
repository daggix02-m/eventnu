'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

interface OrganizersCTAProps {
  contactUrl: string
}

const PAYMENT_LOGOS = ['Telebirr', 'CBE Birr', 'Chapa', 'Visa', 'Mastercard']

export function OrganizersCTA({ contactUrl }: OrganizersCTAProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLParagraphElement>(null)
  const ctaGroupRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      tl.fromTo(wrapperRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 })
      tl.from(headlineRef.current, { opacity: 0, y: 16, duration: 0.4 }, '-=0.3')
      tl.from(bodyRef.current, { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      if (ctaGroupRef.current) {
        tl.from(
          ctaGroupRef.current.children,
          { opacity: 0, y: 12, duration: 0.3, stagger: 0.08 },
          '-=0.15',
        )
      }
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-3xl border-t border-outline-variant/30 overflow-hidden bg-[#0e0c10]"
    >
      {/* Dynamic colorful blur blobs */}
      <div
        className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 -translate-x-1/2"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-secondary/10 rounded-full blur-[130px] pointer-events-none -translate-y-1/2 translate-x-1/2"
        aria-hidden="true"
      />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 grid-pattern opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        <div
          ref={wrapperRef}
          className="text-center max-w-4xl mx-auto space-y-xl relative z-10 opacity-0"
        >
          {/* Logo badge */}
          <div className="flex justify-center select-none">
            <div className="p-xs bg-surface-container-high border border-outline-variant/40 rounded-2xl shadow-xl shadow-black/50 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="Event Nu logo"
                width={794}
                height={672}
                style={{ height: '64px', width: 'auto' }}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-sm">
            <h2
              ref={headlineRef}
              className="font-display text-[36px] md:text-[54px] lg:text-[64px] font-extrabold text-white leading-tight"
            >
              Addis Ababa&apos;s Next Sold-Out Event &mdash;{' '}
              <span className="premium-gradient">Yours.</span>
            </h2>
            <p
              ref={bodyRef}
              className="text-on-surface text-[18px] md:text-[21px] leading-relaxed max-w-[42rem] mx-auto"
            >
              List your first experience in under 60 seconds. Connect with active local audiences
              and start processing checkouts today.
            </p>
          </div>

          {/* CTAs */}
          <div
            ref={ctaGroupRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-md pt-sm"
          >
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Link href={contactUrl} className="flex items-center justify-center gap-xs">
                Start Publishing Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto hover:bg-primary/5 hover:border-primary active:scale-95 transition-all duration-200"
            >
              <Link href={contactUrl} className="flex items-center justify-center gap-xs">
                <MessageCircle className="w-5 h-5" />
                Talk to Sales
              </Link>
            </Button>
          </div>

          {/* Supported payments label strip */}
          <div
            className="flex items-center justify-center gap-xs pt-lg flex-wrap"
            aria-label="Supported payout methods"
          >
            <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mr-xs">
              Fast payouts via:
            </span>
            {PAYMENT_LOGOS.map((name) => (
              <span
                key={name}
                className="px-sm py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/30 font-mono text-[11px] text-on-surface-variant"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
