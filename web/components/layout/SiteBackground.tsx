'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const PixelBlast = dynamic(() => import('@/components/effects/PixelBlast'), { ssr: false })

export function SiteBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)
  // Coarse-pointer devices (phones/tablets, incl. all iPhones) don't get the
  // full-screen WebGL shader: on iOS it saturates the GPU and starves the
  // homepage marquee/carousel rAF loops, which is what made auto-scroll
  // stutter/freeze on iPhones while it stayed smooth on desktop.
  const [isCoarse, setIsCoarse] = useState(false)
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
    const mq = window.matchMedia('(pointer: coarse)')
    setIsCoarse(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches)
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

  // Reduced-motion users AND touch devices get the static violet frame so the
  // page still has depth — but nothing moves and no GPU/WebGL runs.
  const useStatic = reducedMotion || isCoarse

  return (
    <div ref={sentinelRef} className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
      {useStatic ? (
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
