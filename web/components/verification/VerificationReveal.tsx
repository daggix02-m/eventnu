'use client'

import { BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * The surprise verification reveal. Shown once, on the visit after the admin
 * silently grants verification. The signature moment is a wax-seal "stamp" that
 * presses the gold emblem into place; everything else stays quiet. The global
 * `prefers-reduced-motion` rule degrades it to a static seal.
 */
export function VerificationReveal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-reveal-title"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[24rem] overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 text-center shadow-2xl shadow-black/60">
        {/* faint violet glow */}
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />

        {/* Wax seal */}
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping"
            aria-hidden="true"
          />
          <span className="seal-press relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-on-secondary-fixed shadow-lg shadow-amber-900/40">
            <BadgeCheck className="h-10 w-10" strokeWidth={1.75} aria-hidden="true" />
          </span>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
          Event Nu · Official
        </p>

        <h2
          id="verification-reveal-title"
          className="mt-2 font-display text-headline-md text-on-surface"
        >
          You&apos;ve been verified
        </h2>

        <p className="mt-2 text-body-md text-on-surface-variant">
          The city recognized your contributions. Your profile now carries the Event Nu seal.
        </p>

        <Button className="mt-6 w-full" onClick={onClose}>
          Show my badge
        </Button>
      </div>
    </div>
  )
}
