import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'evaluate verification eligibility',
  { hours: 24 },
  internal.verification.evaluateEligibility,
  {},
)

crons.interval('expire stories', { hours: 1 }, internal.stories.expireStories, {
  now: Date.now(),
})

// Retention sweep for privately-archived past stories. The mutation re-schedules
// itself in bounded batches, so this cron is just the daily kick.
crons.interval('purge expired story media', { hours: 24 }, internal.stories.purgeExpiredMedia, {
  now: Date.now(),
})

export default crons
