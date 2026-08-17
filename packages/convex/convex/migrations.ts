import { mutation } from './_generated/server'
import { internalMutation } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireAdmin } from './helpers'

/**
 * Map a legacy `hosts` doc into the organizerProfiles shape used for migrated
 * venues. `hostType` and `contactPhone` are intentionally dropped; `slug`
 * becomes the public `organizerHandle`.
 */
export function mapHostToVenueOrganizer(host: Doc<'hosts'>) {
  return {
    organizerName: host.name,
    organizerHandle: host.slug,
    bio: host.description || undefined,
    logoUrl: host.logoUrl ?? undefined,
    website: host.website ?? undefined,
    contactEmail: host.contactEmail ?? undefined,
    managementMode: 'admin_managed' as const,
    kind: 'venue' as const,
    locationText: host.locationText || undefined,
    status: host.status || undefined,
    legacyHostId: host._id,
    followerCount: host.followerCount,
    verified: host.verified,
  }
}

function eventTime(y: number, m: number, d: number, h: number, min: number): number {
  return Date.UTC(y, m - 1, d, h, min) - 3 * 60 * 60 * 1000
}

export const setEventTimes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const patches: {
      slug: string
      startDate: number
      endDate: number
      venueName?: string
      venueAddress?: string
      priceDisplay?: string
    }[] = [
      {
        slug: 'shift',
        startDate: eventTime(2026, 6, 27, 19, 0),
        endDate: eventTime(2026, 6, 27, 21, 0),
        venueName: 'Social Addis',
        venueAddress: 'Bole Atlas',
      },
      {
        slug: 'urban-friends',
        startDate: eventTime(2026, 6, 26, 10, 0),
        endDate: eventTime(2026, 6, 28, 19, 0),
        venueName: 'Nile Source Building',
        venueAddress: 'In front of Ramada Hotel, Bole',
      },
      {
        slug: 'cycle-session',
        startDate: eventTime(2026, 6, 26, 17, 0),
        endDate: eventTime(2026, 6, 26, 23, 59),
        venueName: 'Meskel Square',
        venueAddress: 'Addis Ababa',
      },
      {
        slug: 'tea-gathering',
        startDate: eventTime(2026, 6, 26, 16, 0),
        endDate: eventTime(2026, 6, 26, 23, 59),
        venueName: 'Asewi Cafe, Gym & Spa',
      },
      {
        slug: 'wegdayt',
        startDate: eventTime(2026, 6, 27, 0, 0),
        endDate: eventTime(2026, 6, 27, 23, 59),
        venueName: 'Venue Warehouse',
      },
      {
        slug: 'voice-live',
        startDate: eventTime(2026, 7, 3, 19, 0),
        endDate: eventTime(2026, 7, 3, 23, 59),
        venueName: 'Alliance Ethio-Française',
        priceDisplay: 'Free',
      },
      {
        slug: 'utopia-night',
        startDate: eventTime(2026, 7, 4, 0, 0),
        endDate: eventTime(2026, 7, 4, 23, 59),
        venueName: 'Velvet Rooftop',
        priceDisplay: '1199',
      },
      {
        slug: 'afro-heat',
        startDate: eventTime(2026, 7, 4, 0, 0),
        endDate: eventTime(2026, 7, 4, 23, 59),
        venueName: 'Third Wave',
      },
      {
        slug: 'sip-paint',
        startDate: eventTime(2026, 7, 4, 0, 0),
        endDate: eventTime(2026, 7, 4, 23, 59),
        venueName: 'Bliss Coffee & Ice Cream',
      },
      {
        slug: 'jampiano',
        startDate: eventTime(2026, 7, 4, 23, 0),
        endDate: eventTime(2026, 7, 4, 23, 59),
        venueName: 'Luxx Ignite',
        venueAddress: 'Bole Atlas',
      },
      {
        slug: 'adventure-run',
        startDate: eventTime(2026, 7, 5, 7, 0),
        endDate: eventTime(2026, 7, 5, 23, 59),
        venueName: 'Gullele Botanical Garden',
        priceDisplay: '1,800',
      },
      {
        slug: 'unity-in-beats',
        startDate: eventTime(2026, 7, 18, 18, 0),
        endDate: eventTime(2026, 7, 19, 3, 0),
        venueName: 'Venue Warehouse',
      },
      {
        slug: 'networking-night',
        startDate: eventTime(2026, 7, 18, 18, 0),
        endDate: eventTime(2026, 7, 18, 23, 59),
        venueName: 'The Alchemist',
        venueAddress: 'Bole Rwanda',
        priceDisplay: '700',
      },
      {
        slug: 'ertib',
        startDate: eventTime(2026, 7, 18, 0, 0),
        endDate: eventTime(2026, 7, 18, 23, 59),
        priceDisplay: '300',
      },
      {
        slug: 'night-shift',
        startDate: eventTime(2026, 7, 25, 0, 0),
        endDate: eventTime(2026, 7, 25, 23, 59),
        priceDisplay: '400 / 500 / 600',
      },
      {
        slug: 'bloom-week',
        startDate: eventTime(2026, 7, 24, 10, 0),
        endDate: eventTime(2026, 7, 26, 21, 0),
        venueName: 'Nile Source Building',
        venueAddress: 'In front of Ramada Hotel, Bole',
      },
    ]

    let updated = 0
    let missing = 0
    for (const p of patches) {
      const event = await ctx.db
        .query('events')
        .withIndex('by_slug', (q) => q.eq('slug', p.slug))
        .unique()
      if (!event) {
        missing += 1
        continue
      }
      await ctx.db.patch('events', event._id, {
        startDate: p.startDate,
        endDate: p.endDate,
        venueName: p.venueName ?? event.venueName,
        venueAddress: p.venueAddress ?? event.venueAddress,
        priceDisplay: p.priceDisplay ?? event.priceDisplay,
      })
      updated += 1
    }
    return { updated, missing }
  },
})

export const backfillProfileVerified = internalMutation({
  args: {},
  handler: async (ctx) => {
    let patched = 0
    for await (const profile of ctx.db.query('profiles')) {
      if ((profile as unknown as { verified?: boolean }).verified === undefined) {
        await ctx.db.patch('profiles', profile._id, { verified: false })
        patched++
      }
    }
    return { patched }
  },
})

export const backfillPhaseBFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    let profilesPatched = 0
    let orgsPatched = 0
    for await (const p of ctx.db.query('profiles')) {
      if ((p as unknown as { followerCount?: number }).followerCount === undefined) {
        await ctx.db.patch('profiles', p._id, { followerCount: 0 })
        profilesPatched++
      }
    }
    for await (const o of ctx.db.query('organizerProfiles')) {
      if ((o as unknown as { managementMode?: string }).managementMode === undefined) {
        await ctx.db.patch('organizerProfiles', o._id, { managementMode: 'organizer_managed' })
        orgsPatched++
      }
    }
    return { profilesPatched, orgsPatched }
  },
})

export const backfillHostsToOrganizers = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0
    let skipped = 0
    for await (const host of ctx.db.query('hosts')) {
      const existing = await ctx.db
        .query('organizerProfiles')
        .filter((q) => q.eq(q.field('legacyHostId'), host._id))
        .first()
      if (existing) {
        skipped++
        continue
      }
      await ctx.db.insert('organizerProfiles', mapHostToVenueOrganizer(host))
      inserted++
    }
    return { inserted, skipped }
  },
})

export const backfillEventOwnerId = internalMutation({
  args: {},
  handler: async (ctx) => {
    let patched = 0
    let skipped = 0
    let unresolved = 0
    for await (const event of ctx.db.query('events')) {
      if (event.ownerId) {
        skipped++
        continue
      }
      let ownerId: Id<'organizerProfiles'> | undefined
      if (event.organizerId) {
        const profileId = event.organizerId
        const org = await ctx.db
          .query('organizerProfiles')
          .withIndex('by_profile', (q) => q.eq('profileId', profileId))
          .first()
        ownerId = org?._id
      } else if (event.hostId) {
        const hostId = event.hostId
        const org = await ctx.db
          .query('organizerProfiles')
          .filter((q) => q.eq(q.field('legacyHostId'), hostId))
          .first()
        ownerId = org?._id
      }
      if (ownerId) {
        await ctx.db.patch('events', event._id, { ownerId })
        patched++
      } else {
        unresolved++
      }
    }
    return { patched, skipped, unresolved }
  },
})

export const backfillFollowTypeHost = internalMutation({
  args: {},
  handler: async (ctx) => {
    let remapped = 0
    for await (const follow of ctx.db.query('follows')) {
      if (follow.followType !== 'host') continue
      const org = await ctx.db
        .query('organizerProfiles')
        .filter((q) => q.eq(q.field('legacyHostId'), follow.followingId))
        .first()
      if (!org) continue
      await ctx.db.patch('follows', follow._id, {
        followType: 'organizer',
        followingId: org._id as unknown as Id<'profiles'>,
      })
      remapped++
    }
    return { remapped }
  },
})

export const backfillEventCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query('events').take(1000)
    for (const event of events) {
      const legacy = (event as unknown as { categoryIds?: Id<'categories'>[] }).categoryIds
      if (legacy && legacy.length > 0) {
        const existing = await ctx.db
          .query('eventCategories')
          .withIndex('by_eventId_and_categoryId', (q) => q.eq('eventId', event._id))
          .first()
        if (!existing) {
          for (const [i, categoryId] of legacy.entries()) {
            await ctx.db.insert('eventCategories', {
              eventId: event._id,
              categoryId,
              isPrimary: i === 0,
            })
          }
        }
      }
      const reservations = await ctx.db
        .query('reservationRequests')
        .withIndex('by_event', (q) => q.eq('eventId', event._id))
        .take(500)
      const current = (event as unknown as { reservationCount?: number }).reservationCount ?? 0
      if (current !== reservations.length) {
        await ctx.db.patch('events', event._id, {
          reservationCount: reservations.length,
        })
      }
    }
    return { processed: events.length }
  },
})
