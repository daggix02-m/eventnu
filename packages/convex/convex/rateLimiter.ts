import { RateLimiter } from '@convex-dev/rate-limiter'
import { components } from './_generated/api'

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  submitContact: { kind: 'fixed window', rate: 10, period: 60_000 },
  reservationCreate: { kind: 'fixed window', rate: 20, period: 60_000 },
  reservationPerEmail: { kind: 'fixed window', rate: 3, period: 24 * 60 * 60 * 1000 },
  commentCreate: { kind: 'token bucket', rate: 20, period: 60_000, capacity: 5 },
  likeToggle: { kind: 'token bucket', rate: 60, period: 60_000, capacity: 10 },
  followToggle: { kind: 'token bucket', rate: 30, period: 60_000, capacity: 10 },
  uploadUrl: { kind: 'token bucket', rate: 30, period: 60_000, capacity: 10 },
  bookmarkToggle: { kind: 'token bucket', rate: 60, period: 60_000, capacity: 10 },
  shareTrack: { kind: 'token bucket', rate: 120, period: 60_000, capacity: 30 },
  experiencePostCreate: { kind: 'fixed window', rate: 10, period: 60_000 },
})
