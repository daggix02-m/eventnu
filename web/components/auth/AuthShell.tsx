import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, MotionConfig } from 'motion/react'
import { CalendarDays, Compass, Heart } from 'lucide-react'

export function AuthShell({
  title,
  description,
  children,
  asideTitle,
  asideDescription,
  showTermsFooter = true,
  subCardActions,
}: {
  title: string
  description: string
  children: ReactNode
  asideTitle: string
  asideDescription: string
  showTermsFooter?: boolean
  subCardActions?: ReactNode
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh overflow-y-auto overscroll-y-contain px-gutter">
        {/* Subtle grid overlay — hidden on mobile to reduce visual noise */}
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-10 [background-image:linear-gradient(rgba(208,188,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(208,188,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] lg:block"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center gap-sm py-lg lg:flex-row lg:items-center lg:justify-center lg:gap-2xl">
          {/* ── Marketing aside (desktop) ── */}
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="hidden max-w-[28rem] lg:block"
            aria-label="Event Nu benefits"
          >
            <Link href="/" className="inline-flex items-center gap-sm text-on-surface">
              <Image
                src="/logo.png"
                alt="Event Nu"
                width={794}
                height={672}
                style={{ height: '36px', width: 'auto' }}
                className="transition-transform duration-200 group-hover:scale-105"
                priority
              />
              <span className="sr-only">Event Nu</span>
            </Link>
            <p className="mt-2 font-mono text-label-sm uppercase tracking-[0.2em] text-primary">
              Addis Ababa / Event discovery
            </p>
            <h2 className="mt-xl max-w-[34rem] font-display text-4xl font-extrabold leading-tight text-on-surface xl:text-5xl">
              {asideTitle}
            </h2>
            <p className="mt-md max-w-[34rem] text-body-lg leading-relaxed text-on-surface-variant">
              {asideDescription}
            </p>

            <ul
              className="mt-xl grid max-w-[36rem] gap-sm sm:grid-cols-3"
              aria-label="Account benefits"
            >
              <li className="border-l-2 border-primary/60 pl-sm">
                <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-xs font-semibold text-on-surface">Find your next plan</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Browse what is happening now.
                </p>
              </li>
              <li className="border-l-2 border-secondary/60 pl-sm">
                <Heart className="h-5 w-5 text-secondary" aria-hidden="true" />
                <p className="mt-xs font-semibold text-on-surface">Save the good ones</p>
                <p className="mt-1 text-sm text-on-surface-variant">Keep a shortlist for later.</p>
              </li>
              <li className="border-l-2 border-tertiary/60 pl-sm">
                <CalendarDays className="h-5 w-5 text-tertiary" aria-hidden="true" />
                <p className="mt-xs font-semibold text-on-surface">Show up ready</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Keep your plans in one place.
                </p>
              </li>
            </ul>
          </motion.aside>

          {/* ── Auth card ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[34rem] shrink-0"
          >
            {/* Mobile header */}
            <div className="mb-2 flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-sm text-on-surface">
                <Image
                  src="/logo.png"
                  alt="Event Nu"
                  width={794}
                  height={672}
                  style={{ height: '28px', width: 'auto' }}
                  priority
                />
                <span className="sr-only">Event Nu</span>
              </Link>
            </div>

            {/* Card */}
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <header className="mb-4">
                <h1 className="font-display text-display-sm text-on-surface sm:text-display-md">
                  {title}
                </h1>
                <p className="mt-1.5 text-body-md leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              </header>
              {children}
            </div>

            {/* Sub-card actions — outside glass-card to avoid backdrop-filter click issues */}
            {subCardActions}

            {showTermsFooter && (
              <p className="mt-3 text-center text-xs text-on-surface-variant">
                By continuing, you agree to Event Nu&apos;s{' '}
                <Link
                  href="/info/terms-of-service"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/info/privacy-policy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  )
}
