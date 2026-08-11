import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns the message of a plain Error', () => {
    expect(getErrorMessage(new Error('Something broke'))).toBe('Something broke')
  })

  it('maps network failures to a friendly message', () => {
    expect(getErrorMessage(new Error('Network request failed'))).toBe(
      'Unable to connect to the server. Please check your connection and try again.',
    )
    expect(getErrorMessage(new Error('Failed to fetch'))).toBe(
      'Unable to connect to the server. Please check your connection and try again.',
    )
  })

  it('maps auth/session failures to a friendly message', () => {
    expect(getErrorMessage(new Error('Unauthorized'))).toBe(
      'Your session has expired. Please sign in again.',
    )
    expect(getErrorMessage(new Error('Request failed with status 401'))).toBe(
      'Your session has expired. Please sign in again.',
    )
  })

  it('maps forbidden and not-found failures', () => {
    expect(getErrorMessage(new Error('Forbidden'))).toBe(
      'You do not have permission to perform this action.',
    )
    expect(getErrorMessage(new Error('Not Found'))).toBe('The requested resource was not found.')
  })

  it('falls back for an empty message', () => {
    expect(getErrorMessage(new Error(''), 'Custom fallback')).toBe('Custom fallback')
  })

  it('accepts string errors', () => {
    expect(getErrorMessage('a string error')).toBe('a string error')
    expect(getErrorMessage('', 'Fallback')).toBe('Fallback')
  })

  it('returns the fallback for non-Error, non-string values', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
    expect(getErrorMessage({ foo: 1 }, 'Custom fallback')).toBe('Custom fallback')
  })
})
