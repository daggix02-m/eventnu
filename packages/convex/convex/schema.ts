import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

const schema = defineSchema({
  ...authTables,

  profiles: defineTable({
    authUserId: v.optional(v.id('users')),
    role: v.union(v.literal('admin'), v.literal('user'), v.literal('organizer')),
    verified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id('profiles')),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    suspended: v.boolean(),
    acceptedTermsAt: v.optional(v.number()),
    acceptedTermsVersion: v.optional(v.string()),
  })
    .index('by_auth_user', ['authUserId'])
    .index('by_role', ['role'])
    .index('by_verified', ['verified']),

  verificationScores: defineTable({
    profileId: v.id('profiles'),
    kind: v.union(v.literal('user'), v.literal('organizer')),
    publishedEvents: v.number(),
    engagementGiven: v.number(),
    followerCount: v.number(),
    experiencePosts: v.number(),
    reservationCount: v.number(),
    eligible: v.boolean(),
    evaluatedAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_eligible', ['eligible']),

  engagementCounters: defineTable({
    profileId: v.id('profiles'),
    likes: v.number(),
    comments: v.number(),
    bookmarks: v.number(),
    shares: v.number(),
    posts: v.number(),
  }).index('by_profile', ['profileId']),

  events: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    subtitle: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    posterUrl: v.optional(v.string()),
    imageAspectRatio: v.optional(v.string()),
    instaPostId: v.optional(v.string()),
    instaPermalink: v.optional(v.string()),
    teaserVideoUrl: v.optional(v.string()),
    videoAspectRatio: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    priceDisplay: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    isFree: v.boolean(),
    actionType: v.union(
      v.literal('open_entry'),
      v.literal('reservation'),
      v.literal('external_link'),
      v.literal('contact'),
    ),
    status: v.union(
      v.literal('draft'),
      v.literal('pending_review'),
      v.literal('published'),
      v.literal('rejected'),
      v.literal('cancelled'),
      v.literal('archived'),
    ),
    source: v.string(),
    ownerId: v.optional(v.id('organizerProfiles')),
    isStandalone: v.boolean(),
    isFeatured: v.boolean(),
    featuredSection: v.optional(v.string()),
    featuredUntil: v.optional(v.number()),
    frequencyType: v.string(),
    reservationEnabled: v.boolean(),
    reservationLimit: v.optional(v.number()),
    likeCount: v.number(),
    bookmarkCount: v.optional(v.number()),
    timezone: v.string(),
    venueName: v.string(),
    venueAddress: v.optional(v.string()),
    venueMapLink: v.optional(v.string()),
    venueLat: v.optional(v.number()),
    venueLng: v.optional(v.number()),
    adminNote: v.optional(v.string()),
    reservationCount: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_slug', ['slug'])
    .index('by_owner', ['ownerId'])
    .index('by_owner_and_status', ['ownerId', 'status'])
    .index('by_isFeatured_and_startDate', ['isFeatured', 'startDate'])
    .index('by_insta_post', ['instaPostId']),

  eventCategories: defineTable({
    eventId: v.id('events'),
    categoryId: v.id('categories'),
    isPrimary: v.boolean(),
  })
    .index('by_eventId_and_categoryId', ['eventId', 'categoryId'])
    .index('by_categoryId_and_eventId', ['categoryId', 'eventId']),

  eventImages: defineTable({
    eventId: v.id('events'),
    storageId: v.optional(v.string()),
    url: v.string(),
    filter: v.optional(v.string()),
    sortOrder: v.number(),
  }).index('by_eventId_and_sortOrder', ['eventId', 'sortOrder']),

  instagramConnections: defineTable({
    igUserId: v.string(),
    igUsername: v.string(),
    accessTokenEncrypted: v.string(),
    tokenExpiresAt: v.number(),
    syncEnabled: v.boolean(),
    autoPublish: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
    connectedAt: v.number(),
    adminId: v.optional(v.id('profiles')),
  }),

  instagramConnectStates: defineTable({
    state: v.string(),
    adminId: v.id('profiles'),
    createdAt: v.number(),
  }).index('by_state', ['state']),

  instagramSyncLogs: defineTable({
    direction: v.union(v.literal('in'), v.literal('out')),
    status: v.union(v.literal('success'), v.literal('error')),
    igMediaId: v.optional(v.string()),
    eventId: v.optional(v.id('events')),
    message: v.optional(v.string()),
  }).index('by_direction', ['direction']),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_parent', ['parentId']),

  organizerProfiles: defineTable({
    profileId: v.optional(v.id('profiles')),
    organizerName: v.string(),
    organizerHandle: v.optional(v.string()),
    bio: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    socialLinks: v.optional(v.any()),
    managementMode: v.optional(v.union(v.literal('admin_managed'), v.literal('organizer_managed'))),
    applicationStatus: v.optional(
      v.union(v.literal('pending_review'), v.literal('approved'), v.literal('rejected')),
    ),
    rejectionReason: v.optional(v.string()),
    kind: v.optional(v.union(v.literal('organizer'), v.literal('venue'))),
    locationText: v.optional(v.string()),
    status: v.optional(v.string()),
    followerCount: v.number(),
    verified: v.boolean(),
  })
    .index('by_profile', ['profileId'])
    .index('by_handle', ['organizerHandle']),

  organizerSettings: defineTable({
    profileId: v.id('profiles'),
    hideLikeCount: v.boolean(),
    notificationEmail: v.boolean(),
    notificationInApp: v.boolean(),
    mentionSetting: v.union(v.literal('allow'), v.literal('block'), v.literal('approve')),
    tagSetting: v.union(v.literal('allow'), v.literal('block')),
    archiveEvents: v.boolean(),
  }).index('by_profile', ['profileId']),

  eventLikes: defineTable({
    userId: v.id('profiles'),
    eventId: v.id('events'),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['eventId'])
    .index('by_userId_and_eventId', ['userId', 'eventId']),

  eventComments: defineTable({
    eventId: v.id('events'),
    userId: v.id('profiles'),
    content: v.string(),
    isDeleted: v.boolean(),
  })
    .index('by_event', ['eventId'])
    .index('by_user', ['userId']),

  follows: defineTable({
    followerId: v.id('profiles'),
    followingId: v.id('profiles'),
    followType: v.string(),
  })
    .index('by_follower', ['followerId'])
    .index('by_followerId_and_followingId', ['followerId', 'followingId'])
    .index('by_following', ['followingId']),

  eventBookmarks: defineTable({
    userId: v.id('profiles'),
    eventId: v.id('events'),
    folderId: v.optional(v.id('bookmarkFolders')),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['eventId'])
    .index('by_userId_and_eventId', ['userId', 'eventId'])
    .index('by_user_and_folder', ['userId', 'folderId']),

  bookmarkFolders: defineTable({
    userId: v.id('profiles'),
    name: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_name', ['userId', 'name']),

  eventShares: defineTable({
    eventId: v.id('events'),
    userId: v.optional(v.id('profiles')),
    platform: v.optional(v.string()),
  })
    .index('by_event', ['eventId'])
    .index('by_user', ['userId']),

  experiencePosts: defineTable({
    userId: v.id('profiles'),
    eventId: v.optional(v.id('events')),
    content: v.string(),
    imageStorageId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isDeleted: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['eventId']),

  pages: defineTable({
    slug: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    body: v.any(),
    bodyHtml: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    sortOrder: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_isPublished_and_sortOrder', ['isPublished', 'sortOrder']),

  announcements: defineTable({
    title: v.string(),
    message: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkText: v.optional(v.string()),
    isActive: v.boolean(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    targetUserId: v.optional(v.id('profiles')),
  }).index('by_active', ['isActive']),

  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    isResolved: v.boolean(),
  }).index('by_resolved', ['isResolved']),

  notifications: defineTable({
    userId: v.id('profiles'),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_userId_and_read', ['userId', 'read']),

  reports: defineTable({
    reporterId: v.id('profiles'),
    targetType: v.string(),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(v.literal('pending'), v.literal('dismissed'), v.literal('actioned')),
    adminNote: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_reporter_and_target', ['reporterId', 'targetType', 'targetId']),

  moderationLogs: defineTable({
    adminId: v.id('profiles'),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    note: v.optional(v.string()),
  })
    .index('by_admin', ['adminId'])
    .index('by_targetType_and_targetId', ['targetType', 'targetId']),

  reservationRequests: defineTable({
    eventId: v.id('events'),
    userId: v.optional(v.id('profiles')),
    name: v.string(),
    email: v.string(),
    message: v.string(),
    status: v.string(),
  }).index('by_event', ['eventId']),

  featuredSections: defineTable({
    slug: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    sortOrder: v.number(),
  }),

  supportTickets: defineTable({
    adminId: v.id('profiles'),
    subject: v.string(),
    message: v.string(),
    priority: v.string(),
    status: v.string(),
  }).index('by_admin', ['adminId']),

  adminSettings: defineTable({
    adminId: v.id('profiles'),
    emailReports: v.boolean(),
    emailEvents: v.boolean(),
    emailUsers: v.boolean(),
  }).index('by_admin', ['adminId']),
})

export default schema
