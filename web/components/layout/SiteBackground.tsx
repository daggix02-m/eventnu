'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { isLowEndDevice, readThemePrimary } from '@/lib/background'

const PixelBlast = dynamic(() => import('@/components/effects/PixelBlast'), { ssr: false })

// Subtle shader speed for reduced-motion users. Following the site's
// "fewer and gentler animations" contract (see useMotionPreference), the
// marquee and carousel still drift slowly for these users — the background
// should too, instead of freezing into a static frame. iOS Safari commonly
// ships with Reduce Motion enabled, so this is what iPhones see.
const FULL_SPEED = 0.5
const SUBTLE_SPEED = 0.12

// Fallback frame shown while the shader is booting or if WebGL never mounts.
// The gradient is inlined because `.static-frame`/`.pixel-blast-container`
// styles live in the dynamically-loaded PixelBlast CSS chunk, which isn't
// loaded until PixelBlast mounts. Without inline dimensions a class-only div
// collapses to zero height and the background reads as plain dark on iOS.
// Inline `position: absolute; inset: 0` makes it fill the fixed parent
// regardless of whether that chunk has loaded.
const staticFrameBackground =
  'radial-gradient(ellipse at 20% 15%, rgba(176,151,207,0.38) 0%, transparent 55%),' +
  'radial-gradient(ellipse at 80% 85%, rgba(176,151,207,0.28) 0%, transparent 50%),' +
  'radial-gradient(ellipse at 50% 50%, rgba(109,59,215,0.24) 0%, transparent 60%)'

const staticFrameStyle = {
  background: staticFrameBackground,
  position: 'absolute',
  inset: 0,
} as const

export function SiteBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inView, setInView] = useState(false)
  // Very low-end devices (≤2 GB RAM, or ≤4 GB with few cores) skip the shader
  // entirely and get the CSS static frame — the WebGL loop would otherwise
  // saturate their GPU. Everything else keeps the full ambient shader.
  const [lowEndDevice, setLowEndDevice] = useState(false)
  // Read the theme's --color-primary so the shader matches the marquee/button
  // accents. Falls back to the previous violet until the stylesheet applies.
  const [shaderColor, setShaderColor] = useState('#B497CF')
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number }
    setLowEndDevice(
      isLowEndDevice({
        deviceMemory: nav.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      }),
    )
    setShaderColor(readThemePrimary('#B497CF'))
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px',
    })
    observer.observe(sentinel)
    // iOS Safari can throttle or miss the initial observer callback (the same
    // quirk useScrollReveal guards against). Never let that leave the
    // background permanently unmounted — the shader's own visibility handling
    // (autoPauseOffscreen) already stops it when the tab is backgrounded.
    const fallbackTimer = window.setTimeout(() => setInView(true), 1000)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallbackTimer)
    }
  }, [])

  // NOTE: PixelBlast itself runs a low-power path on coarse-pointer / small
  // screens (lower resolution, FPS cap, larger pixel cells, no ripples, no
  // AA) so the shader can coexist with the marquee rAF loop on iPhones
  // without starving it.

  return (
    <div ref={sentinelRef} className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
      {inView && !lowEndDevice ? (
        <PixelBlast
          variant="square"
          pixelSize={3}
          color={shaderColor}
          patternScale={2}
          patternDensity={1}
          // This background is decorative only: the wrapper is pointer-events-none
          // behind all content, so the pointer ripples can never fire here. Disable
          // them so desktop GPUs don't run the per-fragment ripple loop for nothing.
          enableRipples={false}
          rippleSpeed={0.3}
          rippleThickness={0.1}
          rippleIntensityScale={1}
          speed={reducedMotion ? SUBTLE_SPEED : FULL_SPEED}
          transparent
          edgeFade={0.5}
        />
      ) : (
        <div className="pixel-blast-container static-frame" style={staticFrameStyle} />
      )}
    </div>
  )
}
