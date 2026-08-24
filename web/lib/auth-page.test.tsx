import { describe, it, expect } from 'vitest'
import { describeError, getPasswordStrength } from '@/components/auth/AuthPage'

describe('describeError', () => {
  it('returns friendly message for Invalid credentials', () => {
    expect(describeError(new Error('Invalid credentials'))).toBe('Invalid email or password.')
  })

  it('returns friendly message for InvalidAccountId', () => {
    expect(describeError(new Error('InvalidAccountId'))).toBe('Invalid email or password.')
  })

  it('returns friendly message for TooManyFailedAttempts', () => {
    expect(describeError(new Error('TooManyFailedAttempts'))).toBe(
      'Too many attempts. Please try again later.',
    )
  })

  it('returns friendly message for Password length error', () => {
    expect(describeError(new Error('Password length must be at least 8'))).toBe(
      'Password must be at least 8 characters.',
    )
  })

  it('returns friendly message for network errors', () => {
    expect(describeError(new Error('Could not connect to server'))).toBe(
      'Could not reach the server. Check your connection and try again.',
    )
  })

  it('returns friendly message for Failed to fetch', () => {
    expect(describeError(new Error('Failed to fetch'))).toBe(
      'Could not reach the server. Check your connection and try again.',
    )
  })

  it('returns friendly message for fetch failed', () => {
    expect(describeError(new Error('fetch failed'))).toBe(
      'Could not reach the server. Check your connection and try again.',
    )
  })

  it('returns friendly message for Account not found', () => {
    expect(describeError(new Error('Account not found'))).toBe('No account found for this email.')
  })

  it('returns friendly message for an account that already exists', () => {
    expect(describeError(new Error('Account foo@bar.com already exists'))).toBe(
      'An account with this email already exists. Please sign in instead.',
    )
    expect(describeError(new Error('already exists'))).toBe(
      'An account with this email already exists. Please sign in instead.',
    )
  })

  it('returns generic message for other errors', () => {
    expect(describeError(new Error('Something weird'))).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('returns generic message for non-Error values', () => {
    expect(describeError('string error')).toBe('Something went wrong. Please try again.')
    expect(describeError(null)).toBe('Something went wrong. Please try again.')
    expect(describeError(undefined)).toBe('Something went wrong. Please try again.')
    expect(describeError(42)).toBe('Something went wrong. Please try again.')
  })

  it('never exposes raw error message text from Error objects', () => {
    const messages = [
      'ConvexError: FOREIGN_KEY_CONSTRAINT on table users',
      'InternalError: stack overflow at line 42',
      'Error: /home/deploy/packages/convex/auth.ts:102',
      'TypeError: Cannot read property of undefined (reading "id")',
    ]
    for (const msg of messages) {
      const result = describeError(new Error(msg))
      expect(result).not.toContain(msg)
      expect(result).not.toContain('/')
      expect(result).not.toContain('line')
    }
  })

  it('returns generic message for object-like non-Error values', () => {
    expect(describeError({ message: 'hack', stack: 'trace' })).toBe(
      'Something went wrong. Please try again.',
    )
    expect(describeError({ toString: () => 'custom string' })).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('returns friendly message for password-related errors (case insensitive)', () => {
    expect(describeError(new Error('password length must be at least 8'))).toBe(
      'Password must be at least 8 characters.',
    )
    expect(describeError(new Error('PASSWORD LENGTH too short'))).toBe(
      'Password must be at least 8 characters.',
    )
  })
})

describe('getPasswordStrength', () => {
  it('returns score 1 (Weak) for empty string', () => {
    const result = getPasswordStrength('')
    expect(result.score).toBe(1)
    expect(result.label).toBe('Weak')
  })

  it('returns score 1 for short lowercase-only password', () => {
    const result = getPasswordStrength('abc')
    expect(result.score).toBe(1)
    expect(result.label).toBe('Weak')
  })

  it('returns score 1 for 8-char lowercase only (no mixed case, no digit, no special)', () => {
    const result = getPasswordStrength('abcdefgh')
    expect(result.score).toBe(1)
    expect(result.label).toBe('Weak')
  })

  it('returns score 2 for 12-char lowercase', () => {
    const result = getPasswordStrength('abcdefghijkl')
    expect(result.score).toBe(2)
    expect(result.label).toBe('Fair')
  })

  it('returns score 3 for 8-char with mixed case and digit', () => {
    const result = getPasswordStrength('Abcdef1g')
    expect(result.score).toBe(3)
    expect(result.label).toBe('Good')
  })

  it('returns score 4 for strong password', () => {
    const result = getPasswordStrength('MyP@ssw0rd!')
    expect(result.score).toBe(4)
    expect(result.label).toBe('Strong')
  })

  it('returns correct color classes', () => {
    expect(getPasswordStrength('abc').color).toBe('bg-error')
    expect(getPasswordStrength('abcdefghijkl').color).toBe('bg-secondary')
    expect(getPasswordStrength('Abcdef1g').color).toBe('bg-primary')
    expect(getPasswordStrength('MyP@ssw0rd!').color).toBe('bg-tertiary')
  })

  it('boundary: exactly 8 chars counts toward length score', () => {
    // 8 chars lowercase only = length >= 8 (1) but no mixed case, no digit, no special = score 1
    expect(getPasswordStrength('abcdefgh').score).toBe(1)
    // 8 chars with mixed case + digit = score 3
    expect(getPasswordStrength('Abcde1fg').score).toBe(3)
  })

  it('boundary: exactly 12 chars counts toward length score', () => {
    // 12 chars lowercase = length >= 8 (1) + length >= 12 (1) = score 2
    expect(getPasswordStrength('abcdefghijkl').score).toBe(2)
    // 12 chars with mixed case + digit = 1+1+1+1 = 4
    expect(getPasswordStrength('Abcdefghij1k').score).toBe(4)
  })

  it('very long password gets max score', () => {
    const longPass = 'A'.repeat(100) + 'b1!'
    expect(getPasswordStrength(longPass).score).toBe(4)
    expect(getPasswordStrength(longPass).label).toBe('Strong')
  })
})
