import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { createTapGuard, FeaturedMarquee } from './FeaturedMarquee'
import type { Event } from '@/types'

vi.mock('next/image', () => ({
  // Mimic next/image's real behaviour: `priority`/`preload` is consumed by the
  // component and becomes `fetchpriority="high"` + eager loading on the <img>,
  // while an explicit fetchPriority string is passed through as-is.
  default: ({
    priority,
    preload,
    fetchPriority,
    ...props
  }: {
    priority?: boolean
    preload?: boolean
    fetchPriority?: string
  } & React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement('img', {
      alt: '',
      ...props,
      fetchpriority: priority || preload ? 'high' : (fetchPriority ?? 'auto'),
    } as React.ImgHTMLAttributes<HTMLImageElement>),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'ev_1',
    title: 'Test Event',
    description: 'A test event',
    start_date: '2099-01-01T18:00:00Z',
    is_free: false,
    status: 'published',
    organizer_id: undefined,
    venue_name: 'Venue',
    poster_url: 'https://example.com/poster.jpg',
    ...overrides,
  }
}

/* -------------------------------------------------------------------------- */
/*  Pure tap-vs-drag guard                                                     */
/* -------------------------------------------------------------------------- */

describe('createTapGuard', () => {
  it('does not suppress a click after a stationary tap', () => {
    const guard = createTapGuard()
    guard.start()
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(false)
  })

  it('does not suppress small finger jitter within the tap slop', () => {
    const guard = createTapGuard()
    guard.start()
    guard.move(4)
    guard.move(-3)
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(false)
  })

  it('suppresses the click after a horizontal drag beyond the slop', () => {
    const guard = createTapGuard()
    guard.start()
    guard.move(-120)
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(true)
  })

  it('cumulates movement across many touchmove events', () => {
    const guard = createTapGuard(8)
    guard.start()
    guard.move(-30)
    guard.move(-30)
    guard.move(-30)
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(true)
  })

  it('resets suppression when the next touch starts', () => {
    const guard = createTapGuard()
    guard.start()
    guard.move(-100)
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(true)

    guard.start()
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(false)
  })

  it('suppresses a drag in either direction', () => {
    const guard = createTapGuard()
    guard.start()
    guard.move(90)
    guard.end()
    expect(guard.shouldSuppressClick()).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/*  Component: off-screen / hidden-tab pausing                                 */
/* -------------------------------------------------------------------------- */

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  fire(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

let rafQueue: Array<(t: number) => void> = []

function stubRaf() {
  rafQueue = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb as (t: number) => void)
    return rafQueue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
}

// Drains one "frame" of queued rAF callbacks. Each callback is handed a
// monotonic timestamp so the marquee's dt-based drift is deterministic.
function tickRaf(times = 1, msStep = 16) {
  let t = performance.now()
  for (let i = 0; i < times; i++) {
    t += msStep
    const q = rafQueue
    rafQueue = []
    for (const cb of q) cb(t)
  }
}

function trackTransform(): string {
  const trackA = document.querySelector<HTMLElement>('[data-track="a"]')
  return trackA?.style.transform ?? ''
}

describe('FeaturedMarquee animation pausing', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    stubRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('advances the strip while on screen, pauses when it scrolls out of view, and resumes', () => {
    render(<FeaturedMarquee events={[makeEvent(), makeEvent({ id: 'ev_2' })]} />)

    act(() => tickRaf(3))
    const advancing = trackTransform()
    expect(advancing).toMatch(/translate3d\(-/)
    expect(advancing).not.toBe('')

    // Scroll out of view -> the loop must stop moving the strip.
    act(() => MockIntersectionObserver.instances[0].fire(false))
    act(() => tickRaf(3))
    expect(trackTransform()).toBe(advancing)

    // Back in view -> the drift resumes.
    act(() => MockIntersectionObserver.instances[0].fire(true))
    act(() => tickRaf(3))
    expect(trackTransform()).not.toBe(advancing)
  })

  it('pauses the strip while the tab is hidden and resumes when visible again', () => {
    render(<FeaturedMarquee events={[makeEvent(), makeEvent({ id: 'ev_2' })]} />)
    act(() => tickRaf(3))
    const advancing = trackTransform()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => tickRaf(3))
    expect(trackTransform()).toBe(advancing)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => tickRaf(3))
    expect(trackTransform()).not.toBe(advancing)
  })

  it('marks only the first LCP card as high-priority', () => {
    const events = Array.from({ length: 5 }, (_, i) => makeEvent({ id: `ev_${i}` }))
    render(<FeaturedMarquee events={events} />)
    const imgs = screen.getAllByRole('img')
    // 2 tracks x 5 events = 10 images. Only the first card of track A is
    // preloaded (the genuine LCP candidate); everything else stays low priority
    // so no wasted preload links are emitted (which caused the browser's
    // "preloaded but not used" warning).
    const highPriority = imgs.filter((img) => img.getAttribute('fetchpriority') === 'high')
    expect(highPriority).toHaveLength(1)
    expect(imgs.filter((img) => img.getAttribute('fetchpriority') === 'low')).toHaveLength(9)
  })
})
