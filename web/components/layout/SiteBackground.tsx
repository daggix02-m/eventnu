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
  // NOTE: the gradient is inlined because `.static-frame` styles live in the
  // dynamically-loaded PixelBlast CSS chunk, which never loads for reduced-
  // motion users (PixelBlast is never mounted) — without the inline styles
  // the frame would render unstyled/invisible, i.e. a "dark" background.
  // NOTE: PixelBlast itself runs a low-power path on coarse-pointer / small
  // screens (lower resolution, FPS cap, larger pixel cells, no ripples, no
  // AA) so the shader can coexist with the marquee rAF loop on iPhones
  // without starving it.
  const staticFrameBackground =
    'radial-gradient(ellipse at 20% 15%, rgba(176,151,207,0.38) 0%, transparent 55%),' +
    'radial-gradient(ellipse at 80% 85%, rgba(176,151,207,0.28) 0%, transparent 50%),' +
    'radial-gradient(ellipse at 50% 50%, rgba(109,59,215,0.24) 0%, transparent 60%)'

  return (
    <div ref={sentinelRef} className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
      {reducedMotion ? (
        <div
          className="pixel-blast-container static-frame"
          style={{ background: staticFrameBackground }}
        />
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
