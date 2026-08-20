import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AUTH_EMAIL_KEY,
  RESET_EMAIL_KEY,
  INVALID_CREDENTIALS,
  setStoredEmail,
  getStoredEmail,
  clearStoredEmail,
  isNetworkError,
  describeSignInError,
} from './auth'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('AUTH_EMAIL_KEY', () => {
  it('has the expected value', () => {
    expect(AUTH_EMAIL_KEY).toBe('eventnu_admin_auth_email')
  })
})

describe('RESET_EMAIL_KEY', () => {
  it('has the expected value', () => {
    expect(RESET_EMAIL_KEY).toBe('eventnu_admin_reset_email')
  })
})

describe('INVALID_CREDENTIALS', () => {
  it('has the expected value', () => {
    expect(INVALID_CREDENTIALS).toBe('Invalid email or password')
  })
})

// ---------------------------------------------------------------------------
// sessionStorage helpers
// ---------------------------------------------------------------------------

describe('setStoredEmail', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => sessionStorage.clear())

  it('stores an email in sessionStorage', () => {
    setStoredEmail(AUTH_EMAIL_KEY, 'admin@example.com')
    expect(sessionStorage.getItem(AUTH_EMAIL_KEY)).toBe('admin@example.com')
  })

  it('uses the provided key', () => {
    setStoredEmail(RESET_EMAIL_KEY, 'reset@example.com')
    expect(sessionStorage.getItem(RESET_EMAIL_KEY)).toBe('reset@example.com')
  })
})

describe('getStoredEmail', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => sessionStorage.clear())

  it('returns the stored email', () => {
    sessionStorage.setItem(AUTH_EMAIL_KEY, 'admin@example.com')
    expect(getStoredEmail(AUTH_EMAIL_KEY)).toBe('admin@example.com')
  })

  it('returns empty string when nothing is stored', () => {
    expect(getStoredEmail(AUTH_EMAIL_KEY)).toBe('')
  })

  it('returns empty string when sessionStorage throws', () => {
    const spy = vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage not available')
    })
    expect(getStoredEmail(AUTH_EMAIL_KEY)).toBe('')
    spy.mockRestore()
  })
})

describe('clearStoredEmail', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => sessionStorage.clear())

  it('removes the stored email', () => {
    sessionStorage.setItem(AUTH_EMAIL_KEY, 'admin@example.com')
    clearStoredEmail(AUTH_EMAIL_KEY)
    expect(sessionStorage.getItem(AUTH_EMAIL_KEY)).toBeNull()
  })

  it('does not throw when key does not exist', () => {
    expect(() => clearStoredEmail('nonexistent')).not.toThrow()
  })

  it('does not throw when sessionStorage is unavailable', () => {
    const spy = vi.spyOn(sessionStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage not available')
    })
    expect(() => clearStoredEmail(AUTH_EMAIL_KEY)).not.toThrow()
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// isNetworkError
// ---------------------------------------------------------------------------

describe('isNetworkError', () => {
  it('returns true for "Failed to fetch"', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
  })

  it('returns true for "Network request failed"', () => {
    expect(isNetworkError(new Error('Network request failed'))).toBe(true)
  })

  it('returns true for "fetch failed"', () => {
    expect(isNetworkError(new Error('fetch failed'))).toBe(true)
  })

  it('returns true for "ECONNRESET"', () => {
    expect(isNetworkError(new Error('ECONNRESET'))).toBe(true)
  })

  it('returns true for "Could not connect to the Convex deployment"', () => {
    expect(isNetworkError(new Error('Could not connect to the Convex deployment'))).toBe(true)
  })

  it('returns false for non-network errors', () => {
    expect(isNetworkError(new Error('Invalid credentials'))).toBe(false)
  })

  it('returns false for non-Error values', () => {
    expect(isNetworkError('string error')).toBe(false)
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
    expect(isNetworkError(42)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// describeSignInError
// ---------------------------------------------------------------------------

describe('describeSignInError', () => {
  const fallback = 'Something went wrong'

  it('returns INVALID_CREDENTIALS for "Invalid credentials"', () => {
    expect(describeSignInError(new Error('Invalid credentials'), fallback)).toBe(
      INVALID_CREDENTIALS,
    )
  })

  it('returns INVALID_CREDENTIALS for "InvalidAccountId"', () => {
    expect(describeSignInError(new Error('InvalidAccountId'), fallback)).toBe(INVALID_CREDENTIALS)
  })

  it('returns INVALID_CREDENTIALS for "InvalidSecret"', () => {
    expect(describeSignInError(new Error('InvalidSecret'), fallback)).toBe(INVALID_CREDENTIALS)
  })

  it('returns rate limit message for "TooManyFailedAttempts"', () => {
    const result = describeSignInError(new Error('TooManyFailedAttempts'), fallback)
    expect(result).toContain('Try again in about an hour')
  })

  it('returns unavailable message for network errors', () => {
    const result = describeSignInError(new Error('Failed to fetch'), fallback)
    expect(result).toContain('try again')
  })

  it('returns fallback for unknown errors', () => {
    expect(describeSignInError(new Error('Unknown'), fallback)).toBe(fallback)
  })

  it('returns fallback for non-Error values', () => {
    expect(describeSignInError('string', fallback)).toBe(fallback)
    expect(describeSignInError(null, fallback)).toBe(fallback)
    expect(describeSignInError(undefined, fallback)).toBe(fallback)
    expect(describeSignInError(42, fallback)).toBe(fallback)
  })

  it('returns fallback for errors with empty message', () => {
    expect(describeSignInError(new Error(''), fallback)).toBe(fallback)
  })
})
