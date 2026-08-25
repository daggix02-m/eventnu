export const MAX_EVENT_IMAGES = 10

export const STATS_SCAN_CAP = 1000

/** Number of shards per event for the like-count counter. */
export const LIKE_COUNT_SHARDS = 10

/**
 * Silent verification eligibility thresholds. Evaluation writes no
 * notifications; the admin performs the final grant as a surprise upgrade.
 */
export const VERIFICATION_THRESHOLDS = {
  organizer: {
    minPublishedEvents: 3,
    minFollowerCount: 20,
    minReservationCount: 10,
    minEngagementGiven: 30,
  },
  user: {
    minEngagementGiven: 15,
    minExperiencePosts: 2,
    minFollowerCount: 25,
  },
} as const
