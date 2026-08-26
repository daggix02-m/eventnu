import { RateLimiter } from '@convex-dev/rate-limiter'
import { components } from './_generated/api'

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  submitContact: { kind: 'fixed window', rate: 10, period: 60_000 },
  reservationCreate: { kind: 'fixed window', rate: 5, period: 60_000 },
  reservationPerEmail: { kind: 'fixed window', rate: 3, period: 24 * 60 * 60_000 },
  reservationPerEvent: { kind: 'fixed window', rate: 10, period: 60_000 },
  commentCreate: { kind: 'token bucket', rate: 20, period: 60_000, capacity: 5 },
  likeToggle: { kind: 'token bucket', rate: 60, period: 60_000, capacity: 10 },
  likeSet: { kind: 'token bucket', rate: 60, period: 60_000, capacity: 10 },
  followToggle: { kind: 'token bucket', rate: 30, period: 60_000, capacity: 10 },
  uploadUrl: { kind: 'token bucket', rate: 30, period: 60_000, capacity: 10 },
  bookmarkToggle: { kind: 'token bucket', rate: 60, period: 60_000, capacity: 10 },
  shareTrack: { kind: 'token bucket', rate: 120, period: 60_000, capacity: 30 },
  experiencePostCreate: { kind: 'fixed window', rate: 10, period: 60_000 },
  storyPublish: { kind: 'fixed window', rate: 5, period: 60 * 60_000 },
  storyView: { kind: 'token bucket', rate: 60, period: 60_000, capacity: 10 },
  reportSubmit: { kind: 'fixed window', rate: 5, period: 60_000 },
  eventCreate: { kind: 'fixed window', rate: 5, period: 60_000 },
  organizerCreate: { kind: 'fixed window', rate: 3, period: 60_000 },
  organizerUpdate: { kind: 'token bucket', rate: 20, period: 60_000, capacity: 5 },
  passwordResetRequest: { kind: 'fixed window', rate: 5, period: 15 * 60_000 },
  passwordResetVerify: { kind: 'fixed window', rate: 10, period: 15 * 60_000 },
  profileUpdate: { kind: 'fixed window', rate: 30, period: 60_000 },
  bootstrapAction: { kind: 'fixed window', rate: 5, period: 60 * 60_000 },
})
