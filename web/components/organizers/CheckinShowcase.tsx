'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { QrCode, Wifi, Shield, Zap, ArrowDownToLine } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { useMotionPreference } from '@/lib/hooks/useMotionPreference'

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time validation',
    body: 'Tickets verify in seconds at the gate — queues keep moving, no delays.',
    color: 'text-primary',
    bg: 'bg-primary/8 border-primary/20',
  },
  {
    icon: Shield,
    title: 'Duplicate protection',
    body: 'Automated duplicate pass blocking with flag alerts at the gate.',
    color: 'text-tertiary',
    bg: 'bg-tertiary/8 border-tertiary/20',
  },
  {
    icon: Wifi,
    title: 'Offline fallback mode',
    body: 'Local cache preserves check-in data when the mobile network drops.',
    color: 'text-secondary',
    bg: 'bg-secondary/8 border-secondary/20',
  },
  {
    icon: ArrowDownToLine,
    title: 'Free organizer app',
    body: 'Available for iOS and Android. No special hardware required \u2014 just your phone.',
    color: 'text-primary',
    bg: 'bg-primary/8 border-primary/20',
  },
] as const

export function OrganizersCheckinShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'valid'>('idle')
  const motion = useMotionPreference()
  const prefersReducedMotion = motion === 'subtle'
  // Reduced-motion users still see the scan feedback cycle, just slower and
  // calmer, rather than a frozen mockup under iOS Reduce Motion.
  const SCAN_CYCLE_MS = prefersReducedMotion ? 10000 : 6000

  // Cycle through scan animation states
  useEffect(() => {
    const cycle = () => {
      setScanState('scanning')
      const t1 = setTimeout(() => setScanState('valid'), prefersReducedMotion ? 3500 : 2500)
      const t2 = setTimeout(() => setScanState('idle'), prefersReducedMotion ? 7000 : 4500)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    const interval = setInterval(cycle, SCAN_CYCLE_MS)
    cycle()
    return () => clearInterval(interval)
  }, [prefersReducedMotion, SCAN_CYCLE_MS])

  useGSAP(
    () => {
      // Reduced-motion users get opacity-only fades (no lateral glide) so
      // nothing slides around under iOS Reduce Motion.
      if (mockupRef.current) {
        gsap.fromTo(
          mockupRef.current,
          prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.96 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.65,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: mockupRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          },
        )
      }
      if (textRef.current) {
        const textEls = textRef.current.querySelectorAll('h2, p, .text-feature-grid')
        if (textEls.length) {
          gsap.fromTo(textEls, prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: textRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          })
        }
      }
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-2xl border-t border-outline-variant/30 bg-surface-dim/40"
    >
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-xl">
          {/* LEFT — Phone mockup */}
          <div ref={mockupRef} className="flex-1 w-full flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="relative w-[280px] md:w-[320px] h-[520px] rounded-[40px] border-[8px] border-surface-container-high bg-background shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
                {/* Notch */}
                <div
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20"
                  aria-hidden="true"
                />

                <div className="flex flex-col items-center justify-between flex-1 pt-8 pb-4 text-center px-sm">
                  {/* Header */}
                  <div className="space-y-xs">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant block">
                      Gate Entrance 1
                    </span>
                    <h4 className="font-display text-[14px] font-bold text-white">
                      Event Nu Entry
                    </h4>
                  </div>

                  {/* Scanner viewfinder */}
                  <div className="relative w-44 h-44 rounded-2xl bg-zinc-950 border border-outline-variant/30 flex items-center justify-center overflow-hidden">
                    {/* Scan line */}
                    {scanState === 'scanning' && (
                      <div
                        className="absolute inset-x-2 h-[2px] bg-emerald-400"
                        style={{
                          animation: prefersReducedMotion
                            ? 'none'
                            : 'scan-sweep 1.5s ease-in-out infinite',
                        }}
                        aria-hidden="true"
                      />
                    )}

                    {scanState === 'valid' ? (
                      <div className="flex flex-col items-center gap-xs animate-in fade-in duration-300">
                        <Shield className="w-12 h-12 text-green-400" aria-hidden="true" />
                        <span className="font-mono text-[11px] text-green-400 font-bold">
                          VALID
                        </span>
                      </div>
                    ) : (
                      <QrCode className="w-24 h-24 text-zinc-700 opacity-60" aria-hidden="true" />
                    )}
                  </div>

                  {/* Result display */}
                  <div className="w-full">
                    <div
                      className={`p-sm rounded-xl border space-y-1 transition-all duration-500 ${
                        scanState === 'valid'
                          ? 'bg-green-950/30 border-green-500/40'
                          : 'bg-surface-container/40 border-outline-variant/20'
                      }`}
                    >
                      {scanState === 'valid' ? (
                        <>
                          <div className="flex items-center justify-center gap-xs text-green-400 font-bold text-[14px]">
                            <Shield className="w-4 h-4" aria-hidden="true" /> Valid Ticket
                          </div>
                          <span className="block font-mono text-[10px] text-on-surface-variant">
                            Abel Solomon — VIP Pass
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-xs text-on-surface-variant text-[12px]">
                            <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                            {scanState === 'scanning' ? 'Scanning...' : 'Ready to scan'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat chip */}
              <div
                className="absolute -right-4 top-16 px-sm py-xs rounded-xl glass-card border border-tertiary/30 shadow-lg shadow-black/40 flex items-center gap-xs"
                aria-hidden="true"
              >
                <Zap className="w-3.5 h-3.5 text-tertiary" />
                <span className="font-mono text-[11px] text-tertiary font-bold">
                  Real-time sync
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — Text */}
          <div ref={textRef} className="flex-1 space-y-md text-left">
            <h2 className="font-display text-[28px] md:text-[40px] font-extrabold text-white leading-tight">
              Zero bottlenecks.
              <br />
              Fast, reliable entry scanning.
            </h2>
            <p className="text-on-surface text-body-lg leading-relaxed">
              Scan tickets in seconds with the Event Nu Organizer App. Works offline, syncs in
              real-time across multiple devices, and handles gate lookup effortlessly.
            </p>

            <div className="text-feature-grid grid grid-cols-1 sm:grid-cols-2 gap-sm pt-sm">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`p-sm rounded-xl border flex items-start gap-sm hover:scale-[1.02] transition-transform duration-200 ${f.bg}`}
                >
                  <f.icon className={`w-5 h-5 ${f.color} shrink-0 mt-0.5`} aria-hidden="true" />
                  <div>
                    <h4 className="font-display text-[14px] font-bold text-white mb-0.5">
                      {f.title}
                    </h4>
                    <p className="text-on-surface text-[13px] leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* CSS for scan sweep animation */}
      <style jsx global>{`
        @keyframes scan-sweep {
          0% {
            top: 10%;
          }
          50% {
            top: 85%;
          }
          100% {
            top: 10%;
          }
        }
      `}</style>
    </section>
  )
}
