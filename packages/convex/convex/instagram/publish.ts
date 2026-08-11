import { v } from 'convex/values'
import { action, internalMutation, internalQuery, env } from '../_generated/server'
import { api, internal } from '../_generated/api'
import { MAX_EVENT_IMAGES } from '../constants'
import { requireAppEnv, decryptToken } from './crypto'
import { graphFetch } from './shared'

export const publishToInstagram = action({
  args: { eventId: v.id('events'), caption: v.string() },
  handler: async (ctx, args) => {
    requireAppEnv()
    const profile = await ctx.runQuery(api.profiles.getMe)
    if (!profile) throw new Error('Not authenticated')
    if (profile.suspended || profile.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const conn = await ctx.runQuery(internal.instagram.connect.getConnectionInternal)
    if (!conn) throw new Error('Instagram is not connected')
    if (!conn.autoPublish) throw new Error('Publishing to Instagram is disabled')
    if (conn.tokenExpiresAt < Date.now()) {
      throw new Error('Instagram access token expired — reconnect in Settings')
    }
    const token = await decryptToken(conn.accessTokenEncrypted, env.INSTAGRAM_ENCRYPTION_KEY!)

    const event = await ctx.runQuery(internal.instagram.publish.getEventForPublish, {
      eventId: args.eventId,
    })
    if (!event) throw new Error('Event not found')
    if (event.images.length === 0) throw new Error('Event has no images')

    const caption = args.caption.slice(0, 2200)
    const igUserId = conn.igUserId

    let publishedId: string
    try {
      if (event.images.length === 1) {
        const container = await graphFetch<{ id?: string }>(
          `${igUserId}/media`,
          { access_token: token, image_url: event.images[0].url, caption },
          'POST',
        )
        const publish = await graphFetch<{ id?: string }>(
          `${igUserId}/media_publish`,
          { access_token: token, creation_id: String(container.id) },
          'POST',
        )
        publishedId = String(publish.id)
      } else {
        const children: string[] = []
        for (const img of event.images.slice(0, MAX_EVENT_IMAGES)) {
          const c = await graphFetch<{ id?: string }>(
            `${igUserId}/media`,
            { access_token: token, image_url: img.url, is_carousel_item: 'true' },
            'POST',
          )
          children.push(String(c.id))
        }
        const container = await graphFetch<{ id?: string }>(
          `${igUserId}/media`,
          {
            access_token: token,
            media_type: 'CAROUSEL',
            children: children.join(','),
            caption,
          },
          'POST',
        )
        const publish = await graphFetch<{ id?: string }>(
          `${igUserId}/media_publish`,
          { access_token: token, creation_id: String(container.id) },
          'POST',
        )
        publishedId = String(publish.id)
      }
    } catch (e) {
      await ctx.runMutation(internal.instagram.publish.logSync, {
        direction: 'out',
        status: 'error',
        eventId: args.eventId,
        message: (e as Error).message,
      })
      throw e
    }

    let permalink = ''
    try {
      const mediaInfo = await graphFetch<{ permalink?: string }>(publishedId, {
        access_token: token,
        fields: 'permalink',
      })
      permalink = mediaInfo.permalink ?? ''
    } catch {
      // permalink fetch failed, keep empty
    }

    await ctx.runMutation(internal.instagram.publish.markPublished, {
      eventId: args.eventId,
      instaPostId: publishedId,
      instaPermalink: permalink,
    })
    await ctx.runMutation(internal.instagram.publish.logSync, {
      direction: 'out',
      status: 'success',
      eventId: args.eventId,
      igMediaId: publishedId,
    })
    return { ok: true, instaPostId: publishedId, instaPermalink: permalink }
  },
})

export const getEventForPublish = internalQuery({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const event = await ctx.db.get('events', args.eventId)
    if (!event) return null
    const images = await ctx.db
      .query('eventImages')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .order('asc')
      .take(MAX_EVENT_IMAGES)
    return {
      title: event.title,
      description: event.description,
      images: images.map((img) => ({
        url: img.url,
        storageId: img.storageId ?? null,
      })),
    }
  },
})

export const markPublished = internalMutation({
  args: {
    eventId: v.id('events'),
    instaPostId: v.string(),
    instaPermalink: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('events', args.eventId, {
      instaPostId: args.instaPostId,
      instaPermalink: args.instaPermalink,
    })
    const conn = await ctx.db.query('instagramConnections').first()
    if (conn) await ctx.db.patch(conn._id, { lastSyncedAt: Date.now() })
  },
})

export const logSync = internalMutation({
  args: {
    direction: v.union(v.literal('in'), v.literal('out')),
    status: v.union(v.literal('success'), v.literal('error')),
    igMediaId: v.optional(v.string()),
    eventId: v.optional(v.id('events')),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('instagramSyncLogs', {
      direction: args.direction,
      status: args.status,
      igMediaId: args.igMediaId,
      eventId: args.eventId,
      message: args.message,
    })
  },
})
