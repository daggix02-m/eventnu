import type { Doc } from '@eventnu/convex/_generated/dataModel'
import { toDateTimeLocal } from './format'

function iso(ts?: number | null): string {
  return ts ? new Date(ts).toISOString() : new Date(0).toISOString()
}

export function usernameFromEmail(email?: string | null): string {
  if (!email) return 'user'
  const local = email.split('@')[0] ?? ''
  return local.replace(/[^a-z0-9_.-]/gi, '') || 'user'
}

export function mapProfile(p: Doc<'profiles'> | null | undefined) {
  return {
    id: p?._id ?? '',
    username: usernameFromEmail(p?.email),
    full_name: p?.fullName ?? '',
    email: p?.email ?? '',
    avatar_url: p?.avatarUrl,
    suspended: p?.suspended ?? false,
    created_at: iso(p?._creationTime),
    updated_at: iso(p?._creationTime),
  }
}

export function mapEvent(e: Doc<'events'> | null | undefined) {
  return {
    id: e?._id ?? '',
    title: e?.title ?? '',
    slug: e?.slug,
    description: e?.description ?? '',
    start_date: toDateTimeLocal(e?.startDate),
    end_date: toDateTimeLocal(e?.endDate),
    poster_url: e?.posterUrl,
    image_aspect_ratio: e?.imageAspectRatio,
    insta_permalink: e?.instaPermalink,
    insta_post_id: e?.instaPostId,
    teaser_video_url: e?.teaserVideoUrl,
    video_aspect_ratio: e?.videoAspectRatio,
    external_link: e?.externalLink,
    external_link_label: e?.externalLinkLabel,
    price_display: e?.priceDisplay,
    contact_email: e?.contactEmail,
    is_free: e?.isFree ?? false,
    action_type: e?.actionType ?? 'open_entry',
    status: e?.status ?? 'draft',
    source: e?.source ?? '',
    organizer_id: e?.organizerId,
    host_id: e?.hostId,
    is_standalone: e?.isStandalone ?? false,
    is_featured: e?.isFeatured ?? false,
    featured_section: e?.featuredSection,
    featured_until: iso(e?.featuredUntil),
    frequency_type: e?.frequencyType ?? 'one_time',
    reservation_limit: e?.reservationLimit,
    like_count: e?.likeCount ?? 0,
    timezone: e?.timezone ?? 'Africa/Addis_Ababa',
    venue_name: e?.venueName ?? '',
    venue_address: e?.venueAddress,
    venue_map_link: e?.venueMapLink,
    admin_note: e?.adminNote,
    categoryIds: e?.categoryIds ?? [],
    created_at: iso(e?._creationTime),
    updated_at: iso(e?._creationTime),
  }
}

export function mapHost(h: Doc<'hosts'> | null | undefined) {
  return {
    id: h?._id ?? '',
    name: h?.name ?? '',
    slug: h?.slug ?? '',
    host_type: h?.hostType ?? '',
    description: h?.description ?? '',
    contact_email: h?.contactEmail,
    contact_phone: h?.contactPhone,
    website: h?.website,
    location_text: h?.locationText ?? '',
    logo_url: h?.logoUrl,
    verified: h?.verified ?? false,
    status: h?.status ?? 'active',
    follower_count: h?.followerCount ?? 0,
    created_at: iso(h?._creationTime),
    updated_at: iso(h?._creationTime),
  }
}

export function mapCategory(c: Doc<'categories'> | null | undefined, eventCount = 0) {
  return {
    id: c?._id ?? '',
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    parent_id: c?.parentId ?? null,
    icon: c?.icon ?? null,
    sort_order: c?.sortOrder ?? 0,
    event_count: eventCount,
  }
}

export function mapEventCategory(c: Doc<'categories'> | null | undefined, index = 0) {
  return {
    category_id: c?._id ?? '',
    is_primary: index === 0,
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    icon: c?.icon ?? null,
  }
}

export function mapOrganizer(
  o: Doc<'organizerProfiles'> | null | undefined,
  profile?: Doc<'profiles'> | null | undefined
) {
  return {
    profile_id: o?.profileId ?? '',
    organizer_name: o?.organizerName ?? '',
    bio: o?.bio ?? '',
    logo_url: o?.logoUrl,
    website: o?.website,
    contact_email: o?.contactEmail,
    social_links: o?.socialLinks,
    follower_count: o?.followerCount ?? 0,
    verified: o?.verified ?? false,
    created_at: iso(o?._creationTime),
    updated_at: iso(o?._creationTime),
    organizer_handle: o?.organizerHandle ?? '',
    profiles: profile ? [mapProfile(profile)] : [],
  }
}

export function mapPage(p: Doc<'pages'> | null | undefined) {
  return {
    id: p?._id ?? '',
    slug: p?.slug ?? '',
    title: p?.title ?? '',
    subtitle: p?.subtitle ?? null,
    body_html: p?.bodyHtml ?? null,
    hero_image_url: p?.heroImageUrl ?? null,
    is_published: p?.isPublished ?? false,
    sort_order: p?.sortOrder ?? 0,
    created_at: iso(p?._creationTime),
  }
}

export function mapAnnouncement(a: Doc<'announcements'> | null | undefined) {
  return {
    id: a?._id ?? '',
    title: a?.title ?? '',
    message: a?.message ?? null,
    link_url: a?.linkUrl ?? null,
    link_text: a?.linkText ?? null,
    is_active: a?.isActive ?? false,
    created_at: iso(a?._creationTime),
  }
}

export function mapContactSubmission(s: Doc<'contactSubmissions'> | null | undefined) {
  return {
    id: s?._id ?? '',
    name: s?.name ?? '',
    email: s?.email ?? '',
    message: s?.message ?? '',
    is_resolved: s?.isResolved ?? false,
    created_at: iso(s?._creationTime),
  }
}

export function mapReport(
  r: (Doc<'reports'> & { reporter?: Doc<'profiles'> | null }) | null | undefined
) {
  const reporter = r?.reporter ? mapProfile(r.reporter) : null
  return {
    id: r?._id ?? '',
    profiles: reporter,
    target_type: r?.targetType ?? '',
    target_id: r?.targetId ?? '',
    reason: r?.reason ?? '',
    status: r?.status ?? 'pending',
    admin_note: r?.adminNote ?? null,
    created_at: iso(r?._creationTime),
  }
}

export function mapNotification(
  n: Doc<'notifications'> | null | undefined,
  profile?: Doc<'profiles'> | null | undefined
) {
  return {
    id: n?._id ?? '',
    user_id: n?.userId ?? '',
    type: n?.type ?? '',
    title: n?.title ?? '',
    body: n?.body ?? '',
    read: n?.read ?? false,
    created_at: iso(n?._creationTime),
    profiles: profile
      ? [
          {
            id: profile._id,
            username: usernameFromEmail(profile.email),
            full_name: profile.fullName ?? '',
          },
        ]
      : undefined,
  }
}

export function mapFeaturedSection(s: Doc<'featuredSections'> | null | undefined) {
  return {
    id: s?._id ?? '',
    label: s?.label ?? '',
    description: s?.description ?? '',
    enabled: s?.enabled ?? false,
    sort_order: s?.sortOrder ?? 0,
  }
}

export function mapSupportTicket(t: Doc<'supportTickets'> | null | undefined) {
  return {
    id: t?._id ?? '',
    admin_id: t?.adminId ?? '',
    subject: t?.subject ?? '',
    message: t?.message ?? '',
    priority: t?.priority ?? '',
    status: t?.status ?? '',
    created_at: iso(t?._creationTime),
    updated_at: iso(t?._creationTime),
  }
}

export function mapModerationLog(
  l: (Doc<'moderationLogs'> & { adminName?: string }) | null | undefined
) {
  return {
    id: l?._id ?? '',
    profiles: { full_name: l?.adminName || 'Admin' },
    action: l?.action ?? '',
    target_type: l?.targetType ?? '',
    target_id: l?.targetId ?? '',
    note: l?.note ?? null,
    created_at: iso(l?._creationTime),
  }
}

export function mapTopEvent(e: Doc<'events'> | null | undefined) {
  return {
    id: e?._id ?? '',
    title: e?.title ?? '',
    like_count: e?.likeCount ?? 0,
    start_date: iso(e?.startDate),
  }
}

export function mapReportTargetPreview(
  p:
    | Doc<'eventComments'>
    | Doc<'events'>
    | Doc<'hosts'>
    | Doc<'profiles'>
    | null
    | undefined
):
  | { target_type: 'comment'; content: string }
  | { target_type: 'event'; poster_url?: string; title: string; status: string }
  | { target_type: 'user'; avatar_url?: string; full_name: string; username: string }
  | { target_type: 'host'; logo_url?: string; name: string; status: string }
  | null {
  if (!p) return null
  if ('content' in p) return { target_type: 'comment', content: p.content ?? '' }
  if ('title' in p) return { target_type: 'event', title: p.title ?? '', poster_url: p.posterUrl, status: p.status ?? '' }
  if ('name' in p) return { target_type: 'host', name: p.name ?? '', logo_url: p.logoUrl, status: p.status ?? '' }
  return { target_type: 'user', full_name: p.fullName ?? '', username: usernameFromEmail(p.email), avatar_url: p.avatarUrl }
}

export type MappedProfile = ReturnType<typeof mapProfile>
export type MappedEvent = ReturnType<typeof mapEvent>
export type MappedHost = ReturnType<typeof mapHost>
export type MappedOrganizer = ReturnType<typeof mapOrganizer>
export type MappedReport = ReturnType<typeof mapReport>
export type MappedNotification = ReturnType<typeof mapNotification>
export type MappedModerationLog = ReturnType<typeof mapModerationLog>
