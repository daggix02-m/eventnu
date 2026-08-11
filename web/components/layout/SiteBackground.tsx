'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const PixelBlast = dynamic(() => import('@/components/ui/PixelBlast'), { ssr: false })

export function SiteBackground() {
  const [mounted, setMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!mounted || reducedMotion) return null

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
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
    </div>
  )
}
