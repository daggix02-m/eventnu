import { v } from 'convex/values'
import { internalQuery, internalMutation, internalAction, env } from '../_generated/server'
import { internal } from '../_generated/api'
import { MAX_EVENT_IMAGES } from '../constants'
import { insertEventImages, uniqueSlug } from '../helpers'
import { requireAppEnv, decryptToken } from './crypto'
import { graphFetch, GraphMedia, GraphWebhookEntry, captionParts, storeRemoteImage } from './shared'

export const processWebhook = internalAction({
  args: { entry: v.any() },
  handler: async (ctx, args) => {
    requireAppEnv()
    const conn = await ctx.runQuery(internal.instagram.connect.getConnectionInternal)
    if (!conn || !conn.syncEnabled) return

    const token = await decryptToken(conn.accessTokenEncrypted, env.INSTAGRAM_ENCRYPTION_KEY!)
    const entry = args.entry as GraphWebhookEntry
    const mediaRefs: { id?: string }[] = []
    if (Array.isArray(entry.changes)) {
      for (const ch of entry.changes) {
        if (ch.field === 'media' && ch.value?.id) mediaRefs.push(ch.value)
      }
    }
    if (entry.field === 'media' && entry.value?.id) mediaRefs.push(entry.value)

    for (const ref of mediaRefs) {
      const mediaId = String(ref.id)
      const existing = await ctx.runQuery(internal.instagram.import.findEventByInstaPost, {
        instaPostId: mediaId,
      })
      if (existing) continue

      let media: GraphMedia
      try {
        media = await graphFetch<GraphMedia>(mediaId, {
          access_token: token,
          fields:
            'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,children{media_type,media_url,thumbnail_url}',
        })
      } catch (e) {
        await ctx.runMutation(internal.instagram.publish.logSync, {
          direction: 'in',
          status: 'error',
          igMediaId: mediaId,
          message: (e as Error).message,
        })
        continue
      }

      const rawItems: GraphMedia[] = []
      if (media.media_type === 'CAROUSEL_ALBUM') {
        rawItems.push(...(media.children?.data ?? []))
      } else {
        rawItems.push(media)
      }

      const urls: { url: string; storageId: string }[] = []
      for (const item of rawItems) {
        const src = item.media_url ?? item.thumbnail_url
        if (!src) continue
        const stored = await storeRemoteImage(ctx, src)
        if (stored) urls.push(stored)
        if (urls.length >= MAX_EVENT_IMAGES) break
      }

      if (urls.length === 0) {
        await ctx.runMutation(internal.instagram.publish.logSync, {
          direction: 'in',
          status: 'error',
          igMediaId: mediaId,
          message: 'No downloadable images for media',
        })
        continue
      }

      try {
        await ctx.runMutation(internal.instagram.import.createImportedEvent, {
          instaPostId: mediaId,
          instaPermalink: media.permalink ?? '',
          caption: media.caption ?? '',
          timestamp: media.timestamp ? Math.round(new Date(media.timestamp).getTime()) : Date.now(),
          images: urls,
        })
      } catch (e) {
        await ctx.runMutation(internal.instagram.publish.logSync, {
          direction: 'in',
          status: 'error',
          igMediaId: mediaId,
          message: (e as Error).message,
        })
      }
    }
  },
})

export const findEventByInstaPost = internalQuery({
  args: { instaPostId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query('events')
      .withIndex('by_insta_post', (q) => q.eq('instaPostId', args.instaPostId))
      .first()
    return event ? { _id: event._id } : null
  },
})

export const createImportedEvent = internalMutation({
  args: {
    instaPostId: v.string(),
    instaPermalink: v.string(),
    caption: v.string(),
    timestamp: v.number(),
    images: v.array(v.object({ url: v.string(), storageId: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    const { title, description } = captionParts(args.caption)
    const slug = uniqueSlug(title)
    const eventId = await ctx.db.insert('events', {
      title,
      description,
      slug,
      startDate: args.timestamp,
      endDate: undefined,
      posterUrl: args.images[0]?.url,
      imageAspectRatio: undefined,
      instaPostId: args.instaPostId,
      instaPermalink: args.instaPermalink,
      teaserVideoUrl: undefined,
      videoAspectRatio: undefined,
      externalLink: undefined,
      externalLinkLabel: undefined,
      priceDisplay: undefined,
      contactEmail: undefined,
      isFree: true,
      actionType: 'open_entry',
      status: 'published',
      source: 'instagram',
      organizerId: undefined,
      hostId: undefined,
      isStandalone: true,
      isFeatured: false,
      featuredSection: undefined,
      featuredUntil: undefined,
      frequencyType: 'one_time',
      reservationEnabled: false,
      reservationLimit: undefined,
      likeCount: 0,
      timezone: 'Africa/Addis_Ababa',
      venueName: '',
      venueAddress: undefined,
      venueMapLink: undefined,
      venueLat: undefined,
      venueLng: undefined,
      adminNote: undefined,
    })
    await insertEventImages(ctx, eventId, args.images)
    const conn = await ctx.db.query('instagramConnections').first()
    if (conn) await ctx.db.patch(conn._id, { lastSyncedAt: Date.now() })
    await ctx.db.insert('instagramSyncLogs', {
      direction: 'in',
      status: 'success',
      igMediaId: args.instaPostId,
      eventId,
    })
    return eventId
  },
})
