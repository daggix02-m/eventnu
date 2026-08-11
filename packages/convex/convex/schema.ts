import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  profiles: defineTable({
    authUserId: v.optional(v.id("users")),
    role: v.union(v.literal("admin"), v.literal("user")),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    suspended: v.boolean(),
    acceptedTermsAt: v.optional(v.number()),
    acceptedTermsVersion: v.optional(v.string()),
  }).index("by_auth_user", ["authUserId"]),

  events: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))),
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
      v.literal("open_entry"),
      v.literal("reservation"),
      v.literal("external_link"),
      v.literal("contact"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("published"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("archived"),
    ),
    source: v.string(),
    organizerId: v.optional(v.id("profiles")),
    hostId: v.optional(v.id("hosts")),
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
    .index("by_status", ["status"])
    .index("by_slug", ["slug"])
    .index("by_organizer", ["organizerId"])
    .index("by_host", ["hostId"])
    .index("by_organizer_status", ["organizerId", "status"])
    .index("by_host_status", ["hostId", "status"])
    .index("by_featured", ["isFeatured", "startDate"])
    .index("by_insta_post", ["instaPostId"]),

  eventCategories: defineTable({
    eventId: v.id("events"),
    categoryId: v.id("categories"),
    isPrimary: v.boolean(),
  })
    .index("by_event", ["eventId", "categoryId"])
    .index("by_category", ["categoryId", "eventId"]),

  eventImages: defineTable({
    eventId: v.id("events"),
    storageId: v.optional(v.string()),
    url: v.string(),
    filter: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_event", ["eventId", "sortOrder"]),

  instagramConnections: defineTable({
    igUserId: v.string(),
    igUsername: v.string(),
    accessTokenEncrypted: v.string(),
    tokenExpiresAt: v.number(),
    syncEnabled: v.boolean(),
    autoPublish: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
    connectedAt: v.number(),
    adminId: v.optional(v.id("profiles")),
  }),

  instagramConnectStates: defineTable({
    state: v.string(),
    adminId: v.id("profiles"),
    createdAt: v.number(),
  }).index("by_state", ["state"]),

  instagramSyncLogs: defineTable({
    direction: v.union(v.literal("in"), v.literal("out")),
    status: v.union(v.literal("success"), v.literal("error")),
    igMediaId: v.optional(v.string()),
    eventId: v.optional(v.id("events")),
    message: v.optional(v.string()),
  }).index("by_direction", ["direction"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
  }).index("by_slug", ["slug"]),

  hosts: defineTable({
    name: v.string(),
    slug: v.string(),
    hostType: v.string(),
    description: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    locationText: v.string(),
    logoUrl: v.optional(v.string()),
    verified: v.boolean(),
    status: v.string(),
    followerCount: v.number(),
  }),

  organizerProfiles: defineTable({
    profileId: v.id("profiles"),
    organizerName: v.string(),
    organizerHandle: v.optional(v.string()),
    bio: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    socialLinks: v.optional(v.any()),
    followerCount: v.number(),
    verified: v.boolean(),
  }).index("by_profile", ["profileId"]),

  eventLikes: defineTable({
    userId: v.id("profiles"),
    eventId: v.id("events"),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_user_event", ["userId", "eventId"]),

  eventComments: defineTable({
    eventId: v.id("events"),
    userId: v.id("profiles"),
    content: v.string(),
    isDeleted: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"]),

  follows: defineTable({
    followerId: v.id("profiles"),
    followingId: v.id("profiles"),
    followType: v.string(),
  })
    .index("by_follower", ["followerId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  eventBookmarks: defineTable({
    userId: v.id("profiles"),
    eventId: v.id("events"),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_user_event", ["userId", "eventId"]),

  eventShares: defineTable({
    eventId: v.id("events"),
    userId: v.optional(v.id("profiles")),
    platform: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"]),

  experiencePosts: defineTable({
    userId: v.id("profiles"),
    eventId: v.optional(v.id("events")),
    content: v.string(),
    imageStorageId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isDeleted: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"]),

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
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished", "sortOrder"]),

  announcements: defineTable({
    title: v.string(),
    message: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkText: v.optional(v.string()),
    isActive: v.boolean(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    targetUserId: v.optional(v.id("profiles")),
  }).index("by_active", ["isActive"]),

  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    isResolved: v.boolean(),
  }).index("by_resolved", ["isResolved"]),

  notifications: defineTable({
    userId: v.id("profiles"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  reports: defineTable({
    reporterId: v.id("profiles"),
    targetType: v.string(),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("dismissed"),
      v.literal("actioned"),
    ),
    adminNote: v.optional(v.string()),
  }).index("by_status", ["status"]),

  moderationLogs: defineTable({
    adminId: v.id("profiles"),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    note: v.optional(v.string()),
  })
    .index("by_admin", ["adminId"])
    .index("by_target", ["targetType", "targetId"]),

  reservationRequests: defineTable({
    eventId: v.id("events"),
    userId: v.optional(v.id("profiles")),
    name: v.string(),
    email: v.string(),
    message: v.string(),
    status: v.string(),
  }).index("by_event", ["eventId"]),

  featuredSections: defineTable({
    slug: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    sortOrder: v.number(),
  }),

  supportTickets: defineTable({
    adminId: v.id("profiles"),
    subject: v.string(),
    message: v.string(),
    priority: v.string(),
    status: v.string(),
  }).index("by_admin", ["adminId"]),

  adminSettings: defineTable({
    adminId: v.id("profiles"),
    emailReports: v.boolean(),
    emailEvents: v.boolean(),
    emailUsers: v.boolean(),
  }).index("by_admin", ["adminId"]),
});

export default schema;
