'use client'

import { useScrollReveal } from '@/lib/hooks/useScrollReveal'

export function FindYourzHeading() {
  const ref = useScrollReveal({ y: 20, duration: 0.6 })

  return (
    <div ref={ref} className="px-4 md:px-6 pt-lg md:pt-xl">
      <h2 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface">
        Find <span className="text-primary">yourz</span>
      </h2>
    </div>
  )
}
