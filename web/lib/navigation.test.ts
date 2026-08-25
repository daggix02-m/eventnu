import { describe, it, expect } from 'vitest'
import { shouldShowBackButton } from './navigation'

describe('shouldShowBackButton', () => {
  it('returns false on the home page regardless of history', () => {
    expect(shouldShowBackButton({ pathname: '/', historyLength: 4 })).toBe(false)
  })

  it('returns false when there is no in-app history to go back to (deep link / cold start)', () => {
    expect(shouldShowBackButton({ pathname: '/events/some-event', historyLength: 1 })).toBe(false)
  })

  it('returns true on a subpage with in-app history', () => {
    expect(shouldShowBackButton({ pathname: '/events/some-event', historyLength: 3 })).toBe(true)
  })

  it('returns true on a detail page reached after browsing', () => {
    expect(shouldShowBackButton({ pathname: '/schedule', historyLength: 5 })).toBe(true)
  })

  it('returns true for nested category pages', () => {
    expect(shouldShowBackButton({ pathname: '/categories/nightlife', historyLength: 2 })).toBe(true)
  })
})
