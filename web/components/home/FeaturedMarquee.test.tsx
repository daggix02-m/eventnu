import { describe, it, expect } from 'vitest'
import { createTapGuard } from './FeaturedMarquee'

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
