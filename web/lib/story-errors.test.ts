import { describe, it, expect } from 'vitest'
import { describeStoryError } from './story-errors'

describe('describeStoryError', () => {
  // ── Structured ConvexError data (rate limiter) ──────────────────────────

  describe('rate limiter structured data', () => {
    it('handles ConvexError with data.kind = RateLimited', () => {
      const err = new Error('Server Error')
      ;(err as { data?: unknown }).data = {
        kind: 'RateLimited',
        name: 'storyPublish',
        retryAfter: 1234567,
      }
      expect(describeStoryError(err)).toBe('Too many stories posted. Please try again later.')
    })

    it('handles ConvexError with data.kind = RateLimited even if message is empty', () => {
      const err = new Error('')
      ;(err as { data?: unknown }).data = { kind: 'RateLimited', name: 'storyPublish' }
      expect(describeStoryError(err)).toBe('Too many stories posted. Please try again later.')
    })
  })

  // ── Rate limit string fallbacks ─────────────────────────────────────────

  describe('rate limit string fallbacks', () => {
    it('matches "rate limit" in message', () => {
      const err = new Error('rate limit exceeded')
      expect(describeStoryError(err)).toBe('Too many stories posted. Please try again later.')
    })

    it('matches "RateLimited" in JSON-stringified message', () => {
      const err = new Error('{"kind":"RateLimited","name":"storyPublish"}')
      expect(describeStoryError(err)).toBe('Too many stories posted. Please try again later.')
    })

    it('matches "Too many" in message', () => {
      const err = new Error('Too many requests')
      expect(describeStoryError(err)).toBe('Too many stories posted. Please try again later.')
    })
  })

  // ── Authentication errors ───────────────────────────────────────────────

  describe('authentication errors', () => {
    it('maps "Not authenticated" to sign-in message', () => {
      const err = new Error('Not authenticated')
      expect(describeStoryError(err)).toBe('Please sign in to share a story.')
    })

    it('maps "Account suspended" to suspension message', () => {
      const err = new Error('Account suspended')
      expect(describeStoryError(err)).toBe(
        'Your account has been suspended. Please contact support.',
      )
    })
  })

  // ── Validation errors ───────────────────────────────────────────────────

  describe('validation errors', () => {
    it('maps caption length error', () => {
      const err = new Error('Caption must be 500 characters or fewer')
      expect(describeStoryError(err)).toBe(
        'Caption is too long. Please keep it under 500 characters.',
      )
    })

    it('maps event not found error', () => {
      const err = new Error('Event not found')
      expect(describeStoryError(err)).toBe('The tagged event could not be found.')
    })

    it('maps uploaded file not found error', () => {
      const err = new Error('Uploaded file not found')
      expect(describeStoryError(err)).toBe('Media upload failed. Please try again.')
    })

    it('maps thumbnail file not found error', () => {
      const err = new Error('Thumbnail file not found')
      expect(describeStoryError(err)).toBe('Media upload failed. Please try again.')
    })

    it('maps photo content-type mismatch', () => {
      const err = new Error('Story photo must be an image file')
      expect(describeStoryError(err)).toBe(
        'Invalid file type. Please select the correct media format.',
      )
    })

    it('maps video content-type mismatch', () => {
      const err = new Error('Story video must be a video file')
      expect(describeStoryError(err)).toBe(
        'Invalid file type. Please select the correct media format.',
      )
    })
  })

  // ── Upload errors ───────────────────────────────────────────────────────

  describe('upload errors', () => {
    it('maps HTTP upload failure', () => {
      const err = new Error('Upload failed (HTTP 413)')
      expect(describeStoryError(err)).toBe('Media upload failed. Please try again.')
    })

    it('maps generic upload failure', () => {
      const err = new Error('Upload failed')
      expect(describeStoryError(err)).toBe('Media upload failed. Please try again.')
    })
  })

  // ── Network errors ──────────────────────────────────────────────────────

  describe('network errors', () => {
    it('maps "Could not connect"', () => {
      const err = new Error('Could not connect to server')
      expect(describeStoryError(err)).toBe(
        'Could not reach the server. Check your connection and try again.',
      )
    })

    it('maps "Failed to fetch"', () => {
      const err = new Error('Failed to fetch')
      expect(describeStoryError(err)).toBe(
        'Could not reach the server. Check your connection and try again.',
      )
    })

    it('maps "fetch failed" (lowercase)', () => {
      const err = new Error('fetch failed')
      expect(describeStoryError(err)).toBe(
        'Could not reach the server. Check your connection and try again.',
      )
    })

    it('maps "NetworkError"', () => {
      const err = new Error('NetworkError')
      expect(describeStoryError(err)).toBe(
        'Could not reach the server. Check your connection and try again.',
      )
    })
  })

  // ── Fallback ────────────────────────────────────────────────────────────

  describe('fallback behavior', () => {
    it('returns generic message for unknown Error', () => {
      const err = new Error('Something weird happened')
      expect(describeStoryError(err)).toBe('Failed to publish your story. Please try again.')
    })

    it('returns generic message for non-Error values', () => {
      expect(describeStoryError('string error')).toBe(
        'Failed to publish your story. Please try again.',
      )
    })

    it('returns generic message for null', () => {
      expect(describeStoryError(null)).toBe('Failed to publish your story. Please try again.')
    })

    it('returns generic message for undefined', () => {
      expect(describeStoryError(undefined)).toBe('Failed to publish your story. Please try again.')
    })

    it('returns generic message for plain objects', () => {
      expect(describeStoryError({ code: 42 })).toBe(
        'Failed to publish your story. Please try again.',
      )
    })
  })
})
