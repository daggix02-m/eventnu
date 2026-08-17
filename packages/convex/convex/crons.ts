import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'check instagram token expiry',
  { hours: 24 },
  internal.instagram.connect.checkTokens,
  {},
)

crons.interval(
  'evaluate verification eligibility',
  { hours: 24 },
  internal.verification.evaluateEligibility,
  {},
)

export default crons
