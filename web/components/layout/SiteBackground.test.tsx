import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { SiteBackground } from './SiteBackground'

const FULL_SPEED = 0.5

// SiteBackground loads PixelBlast via next/dynamic. In jsdom there is no WebGL
// context, so swap the dynamic loader for a plain component that echoes props.
// The behaviour under test is SiteBackground's own branching, not WebGL.
function PixelBlastMock(props: Record<string, unknown>) {
  return <div data-testid="pixel-blast" {...props} />
}

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => PixelBlastMock,
}))

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
}

function fireIntersection(isIntersecting: boolean) {
  const observer = MockIntersectionObserver.instances[0]
  observer.callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver,
  )
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  )
}

// requestIdleCallback is absent in jsdom; make it fire immediately so the
// idle-deferral gate opens as soon as effects run.
function stubIdleCallback() {
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((cb: () => void) => {
      cb()
      return 1
    }),
  )
  vi.stubGlobal('cancelIdleCallback', vi.fn())
}

beforeEach(() => {
  MockIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  stubIdleCallback()
  vi.useRealTimers()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'deviceMemory')
})

describe('SiteBackground', () => {
  it('renders the fallback frame with explicit dimensions before the shader mounts', () => {
    stubMatchMedia(false)
    render(<SiteBackground />)
    const frame = document.querySelector('.static-frame')
    expect(frame).toBeInTheDocument()
    expect(frame).toHaveStyle('position: absolute')
    expect(frame).toHaveStyle('inset: 0')
  })

  it('mounts the shader at full speed regardless of reduced-motion preference', async () => {
    stubMatchMedia(true)
    render(<SiteBackground />)
    act(() => fireIntersection(true))
    const shader = await screen.findByTestId('pixel-blast')
    expect(shader.getAttribute('speed')).toBe(String(FULL_SPEED))
  })

  it('mounts the shader at full speed without a reduced-motion preference', async () => {
    stubMatchMedia(false)
    render(<SiteBackground />)
    act(() => fireIntersection(true))
    const shader = await screen.findByTestId('pixel-blast')
    expect(shader.getAttribute('speed')).toBe(String(FULL_SPEED))
  })

  it('mounts the shader via a fallback timer when the observer callback never fires (iOS guard)', () => {
    stubMatchMedia(false)
    vi.useFakeTimers()
    render(<SiteBackground />)
    expect(document.querySelector('.static-frame')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByTestId('pixel-blast')).toBeInTheDocument()
  })

  it('renders the static frame instead of the shader on very low-end devices', async () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 })
    render(<SiteBackground />)
    act(() => fireIntersection(true))
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.queryByTestId('pixel-blast')).not.toBeInTheDocument()
    expect(document.querySelector('.static-frame')).toBeInTheDocument()
  })

  it('still mounts the shader on capable devices', async () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 })
    render(<SiteBackground />)
    act(() => fireIntersection(true))
    expect(await screen.findByTestId('pixel-blast')).toBeInTheDocument()
  })

  it('keeps the shader unmounted until the browser is idle (off the critical path)', () => {
    stubMatchMedia(false)
    vi.stubGlobal('requestIdleCallback', undefined)
    vi.useFakeTimers()
    render(<SiteBackground />)
    act(() => fireIntersection(true))
    expect(screen.queryByTestId('pixel-blast')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByTestId('pixel-blast')).toBeInTheDocument()
  })

  it('tints the shader with the theme primary color', async () => {
    stubMatchMedia(false)
    document.documentElement.style.setProperty('--color-primary', '#d0bcff')
    render(<SiteBackground />)
    act(() => fireIntersection(true))
    const shader = await screen.findByTestId('pixel-blast')
    expect(shader.getAttribute('color')).toBe('#d0bcff')
  })
})
