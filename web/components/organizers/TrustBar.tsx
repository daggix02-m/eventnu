'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { Shield, Star, CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/layout/Container'

const PARTNERS = [
  { name: 'Telebirr', color: 'text-[#00bcd4] border-[#00bcd4]/30 bg-[#00bcd4]/8' },
  { name: 'CBE Birr', color: 'text-[#4caf50] border-[#4caf50]/30 bg-[#4caf50]/8' },
  { name: 'Chapa', color: 'text-[#ff9800] border-[#ff9800]/30 bg-[#ff9800]/8' },
  { name: 'Visa / Mastercard', color: 'text-primary border-primary/30 bg-primary/8' },
  { name: 'Mobile Wallets', color: 'text-secondary border-secondary/30 bg-secondary/8' },
]

const TRUST_BADGES = [
  { icon: Shield, label: 'Secure Payments', sub: 'Encrypted checkout' },
  { icon: Star, label: 'Built in Addis', sub: 'Events city-wide' },
  { icon: CheckCircle2, label: 'Fast Payouts', sub: '24–48 hrs' },
]

export function OrganizersTrustBar() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (sectionRef.current) {
        const items = sectionRef.current.querySelectorAll('.trust-item')
        gsap.fromTo(
          items,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          },
        )
      }
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      aria-label="Payment partners and trust indicators"
      className="relative z-10 py-md border-y border-outline-variant/20 bg-surface-container-lowest/60 overflow-hidden"
    >
      {/* Gradient top line accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-50"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--color-primary) 30%, var(--color-secondary) 70%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <Container>
        <div className="flex flex-col md:flex-row items-center gap-lg">
          {/* Label */}
          <div className="trust-item shrink-0">
            <p className="font-mono text-label-sm uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
              Accepted Payments
            </p>
          </div>

          {/* Partner pills */}
          <div className="flex items-center gap-xs flex-wrap justify-center md:justify-start flex-1">
            {PARTNERS.map((p) => (
              <span
                key={p.name}
                className={`trust-item inline-flex items-center px-sm py-1.5 rounded-full border font-mono text-label-sm font-semibold whitespace-nowrap transition-transform duration-200 hover:scale-105 cursor-default ${p.color}`}
              >
                {p.name}
              </span>
            ))}
          </div>

          {/* Trust badges — desktop only */}
          <div className="trust-item hidden lg:flex items-center gap-sm shrink-0 border-l border-outline-variant/30 pl-lg">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-xs group">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors duration-200">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
                <div className="leading-tight">
                  <p className="font-display text-[12px] font-bold text-white leading-none">
                    {label}
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile trust badges */}
        <div className="lg:hidden mt-sm flex items-center gap-sm justify-center flex-wrap">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="trust-item flex items-center gap-xs px-sm py-1 rounded-full bg-surface-container/40 border border-outline-variant/20"
            >
              <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-[11px] text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
