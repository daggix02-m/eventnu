import { describe, expect, it } from 'vitest'
import { ConvexError } from 'convex/values'
import { toClientAuthError } from './authErrors'

// ---------------------------------------------------------------------------
// toClientAuthError — wraps known auth failures as ConvexError so their
// message survives Convex's production error redaction and reaches the web
// client, whose describeError() maps these exact strings.
// ---------------------------------------------------------------------------

describe('toClientAuthError', () => {
  it('maps InvalidAccountId to a ConvexError saying "Invalid credentials"', () => {
    const err = toClientAuthError(new Error('InvalidAccountId'))
    expect(err).toBeInstanceOf(ConvexError)
    expect((err as ConvexError<string>).data).toBe('Invalid credentials')
  })

  it('maps InvalidSecret to a ConvexError saying "Invalid credentials"', () => {
    const err = toClientAuthError(new Error('InvalidSecret'))
    expect(err).toBeInstanceOf(ConvexError)
    expect((err as ConvexError<string>).data).toBe('Invalid credentials')
  })

  it('maps TooManyFailedAttempts to a ConvexError preserving the message', () => {
    const err = toClientAuthError(new Error('TooManyFailedAttempts'))
    expect(err).toBeInstanceOf(ConvexError)
    expect((err as ConvexError<string>).data).toBe('TooManyFailedAttempts')
  })

  it('maps an existing-account error to a ConvexError that keeps "already exists"', () => {
    const err = toClientAuthError(new Error('Account user@example.com already exists'))
    expect(err).toBeInstanceOf(ConvexError)
    expect((err as ConvexError<string>).data).toContain('already exists')
  })

  it('strips the mutation-stack noise from existing-account errors', () => {
    const noisy = new Error(
      'Uncaught Error: Account user@example.com already exists\n    at createAccountFromCredentialsImpl (...)\n    at async authorize (...)',
    )
    const err = toClientAuthError(noisy)
    expect(err).toBeInstanceOf(ConvexError)
    expect((err as ConvexError<string>).data).toBe('Account user@example.com already exists')
  })

  it('passes through unknown errors unchanged so they keep their original message', () => {
    const original = new Error('Some unexpected backend error')
    expect(toClientAuthError(original)).toBe(original)
  })

  it('passes through non-Error thrown values unchanged', () => {
    const thrown = 'just a string'
    expect(toClientAuthError(thrown)).toBe(thrown)
  })
})
