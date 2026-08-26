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

export default crons
