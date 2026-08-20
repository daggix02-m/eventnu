import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AUTH_REDIRECT_KEY, rememberAuthRedirect, consumeAuthRedirect } from './auth'

describe('AUTH_REDIRECT_KEY', () => {
  it('has the expected value', () => {
    expect(AUTH_REDIRECT_KEY).toBe('eventnu_auth_redirect')
  })
})

describe('rememberAuthRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('stores the pathname in sessionStorage', () => {
    rememberAuthRedirect('/events/test')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/events/test')
  })

  it('concatenates pathname and search', () => {
    rememberAuthRedirect('/events', '?category=music')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/events?category=music')
  })

  it('does not store paths starting with //', () => {
    rememberAuthRedirect('//evil.com')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull()
  })

  it('does not store paths containing backslashes', () => {
    rememberAuthRedirect('/path\\with\\backslash')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull()
  })

  it('does not store paths that do not start with /', () => {
    rememberAuthRedirect('relative-path')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull()
  })

  it('defaults search to empty string', () => {
    rememberAuthRedirect('/about')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBe('/about')
  })
})

describe('consumeAuthRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('returns the stored path and removes it', () => {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, '/saved-event')
    const result = consumeAuthRedirect()
    expect(result).toBe('/saved-event')
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull()
  })

  it('returns fallback when nothing is stored', () => {
    expect(consumeAuthRedirect()).toBe('/')
  })

  it('returns custom fallback when nothing is stored', () => {
    expect(consumeAuthRedirect('/discover')).toBe('/discover')
  })

  it('returns fallback when stored path is unsafe', () => {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, '//evil.com')
    expect(consumeAuthRedirect()).toBe('/')
  })

  it('returns fallback when stored path has backslashes', () => {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, '/path\\bad')
    expect(consumeAuthRedirect()).toBe('/')
  })

  it('removes the key even when returning fallback', () => {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, '//evil.com')
    consumeAuthRedirect()
    expect(sessionStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull()
  })

  it('returns fallback when sessionStorage throws', () => {
    // Mock getItem to throw to simulate storage unavailability
    const spy = vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage not available')
    })
    const result = consumeAuthRedirect()
    expect(result).toBe('/')
    spy.mockRestore()
  })
})
