'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const PixelBlast = dynamic(() => import('@/components/effects/PixelBlast'), { ssr: false })

export function SiteBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inView, setInView] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px',
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Reduced-motion users get the static violet frame so the page still has
  // depth — but nothing moves and no GPU/WebGL runs.
  // NOTE: PixelBlast itself runs a low-power path on coarse-pointer / small
  // screens (lower resolution, FPS cap, fewer FBM octaves, no ripples) so the
  // shader can coexist with the marquee rAF loop on iPhones without starving
  // it. Do NOT disable the shader on touch here — that kills the background.
  return (
    <div ref={sentinelRef} className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
      {reducedMotion ? (
        <div className="pixel-blast-container static-frame" />
      ) : (
        inView && (
          <PixelBlast
            variant="square"
            pixelSize={3}
            color="#B497CF"
            patternScale={2}
            patternDensity={1}
            enableRipples
            rippleSpeed={0.3}
            rippleThickness={0.1}
            rippleIntensityScale={1}
            speed={0.5}
            transparent
            edgeFade={0.5}
          />
        )
      )}
    </div>
  )
}
