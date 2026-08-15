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

  if (reducedMotion) return null

  return (
    <div ref={sentinelRef} className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
      {inView && (
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
      )}
    </div>
  )
}
