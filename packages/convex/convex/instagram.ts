import { v } from 'convex/values'
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
  env,
} from './_generated/server'
import { ActionCtx, MutationCtx } from './_generated/server'
import { api, internal } from './_generated/api'
import { MAX_EVENT_IMAGES } from './constants'
import { insertEventImages, insertNotification, requireAdmin, uniqueSlug } from './helpers'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

function getSiteUrl(): string {
  const e = env as unknown as Record<string, string | undefined>
  return e.CONVEX_SITE_URL ?? ''
}

function requireAppEnv() {
  if (!env.FACEBOOK_APP_ID) {
    throw new Error('FACEBOOK_APP_ID is not configured')
  }
  if (!env.FACEBOOK_APP_SECRET) {
    throw new Error('FACEBOOK_APP_SECRET is not configured')
  }
  if (!env.INSTAGRAM_VERIFY_TOKEN) {
    throw new Error('INSTAGRAM_VERIFY_TOKEN is not configured')
  }
  if (!env.INSTAGRAM_ENCRYPTION_KEY) {
    throw new Error('INSTAGRAM_ENCRYPTION_KEY is not configured')
  }
}

const toHex = (data: ArrayBuffer): string =>
  Array.from(new Uint8Array(data), (b) => b.toString(16).padStart(2, '0')).join('')

const fromHex = (hex: string): Uint8Array<ArrayBuffer> => {
  const buffer = new ArrayBuffer(hex.length / 2)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

async function getCryptoKey(keyStr: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyStr))
  return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

async function encryptToken(plain: string, keyStr: string): Promise<string> {
  const key = await getCryptoKey(keyStr)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  return toHex(iv.buffer) + '.' + toHex(cipher)
}

async function decryptToken(payload: string, keyStr: string): Promise<string> {
  const [ivHex, dataHex] = payload.split('.')
  const key = await getCryptoKey(keyStr)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromHex(ivHex) },
    key,
    fromHex(dataHex).buffer,
  )
  return new TextDecoder().decode(plain)
}

interface GraphTokenResponse {
  access_token?: string
  expires_in?: number
}

interface GraphPage {
  id: string
  name?: string
  instagram_business_account?: { id: string }
}

interface GraphMedia {
  id: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  caption?: string
  permalink?: string
  timestamp?: string
  children?: { data?: GraphMedia[] }
}

interface GraphWebhookEntry {
  changes?: { field?: string; value?: { id?: string } }[]
  field?: string
  value?: { id?: string }
}

async function graphFetch<T = unknown>(
  path: string,
  params: Record<string, string>,
  method: 'GET' | 'POST' = 'GET',
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path}`)
  const init: RequestInit = { method }
  if (method === 'POST') {
    init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    init.body = new URLSearchParams(params).toString()
  } else {
    for (const [k, value] of Object.entries(params)) {
      url.searchParams.set(k, value)
    }
  }
  const res = await fetch(url, init)
  let json: T
  try {
    json = (await res.json()) as T
  } catch {
    throw new Error(`Graph API error ${res.status}`)
  }
  const error = (json as { error?: { message?: string } })?.error
  if (!res.ok || error) {
    throw new Error(error?.message ?? `Graph API error ${res.status}`)
  }
  return json
}

function captionParts(caption: string): { title: string; description: string } {
  const lines = caption
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  let title = (lines[0] ?? 'Untitled event')
    .replace(/^#+\s*/, '')
    .replace(/#[\w-]+/g, '')
    .trim()
  if (!title) title = 'Untitled event'
  return { title, description: caption.trim() }
}

async function storeRemoteImage(
  ctx: ActionCtx,
  url: string,
): Promise<{ url: string; storageId: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const storageId = await ctx.storage.store(new Blob([buf]))
    const storedUrl = await ctx.storage.getUrl(storageId)
    return storedUrl ? { url: storedUrl, storageId } : null
  } catch {
    return null
  }
}

export const getConnectionStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const conn = await ctx.db.query('instagramConnections').first()
    if (!conn) return null
    return {
      igUserId: conn.igUserId,
      igUsername: conn.igUsername,
      tokenExpiresAt: conn.tokenExpiresAt,
      syncEnabled: conn.syncEnabled,
      autoPublish: conn.autoPublish,
      lastSyncedAt: conn.lastSyncedAt ?? null,
      connectedAt: conn.connectedAt,
    }
  },
})

function randomState(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  )
}

const CONNECT_STATE_TTL_MS = 10 * 60 * 1000

export const startConnect = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const admin = await requireAdmin(ctx)
    requireAppEnv()
    const state = randomState()
    const cutoff = Date.now() - CONNECT_STATE_TTL_MS
    const stale = await ctx.db
      .query('instagramConnectStates')
      .filter((q) => q.lt(q.field('createdAt'), cutoff))
      .take(50)
    for (const s of stale) {
      await ctx.db.delete('instagramConnectStates', s._id)
    }
    await ctx.db.insert('instagramConnectStates', {
      state,
      adminId: admin._id,
      createdAt: Date.now(),
    })
    const redirectUri = `${getSiteUrl()}/api/webhooks/instagram/connect-callback`
    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID!,
      redirect_uri: redirectUri,
      scope: 'instagram_business_basic,instagram_business_content_publish,pages_show_list',
      response_type: 'code',
      state,
    })
    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
  },
})

export const setSyncEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx: MutationCtx, args) => {
    await requireAdmin(ctx)
    const conn = await ctx.db.query('instagramConnections').first()
    if (!conn) throw new Error('Instagram is not connected')
    await ctx.db.patch(conn._id, { syncEnabled: args.enabled })
  },
})

export const setAutoPublish = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx: MutationCtx, args) => {
    await requireAdmin(ctx)
    const conn = await ctx.db.query('instagramConnections').first()
    if (!conn) throw new Error('Instagram is not connected')
    await ctx.db.patch(conn._id, { autoPublish: args.enabled })
  },
})

export const disconnect = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    await requireAdmin(ctx)
    const conn = await ctx.db.query('instagramConnections').first()
    if (conn) await ctx.db.delete('instagramConnections', conn._id)
  },
})

export const completeConnect = action({
  args: { code: v.string(), state: v.string() },
  handler: async (ctx, args) => {
    requireAppEnv()
    const stateDoc = await ctx.runQuery(internal.instagram.getConnectState, { state: args.state })
    if (!stateDoc) {
      throw new Error('Invalid or expired connection request')
    }
    if (Date.now() - stateDoc.createdAt > CONNECT_STATE_TTL_MS) {
      await ctx.runMutation(internal.instagram.consumeConnectState, {
        state: args.state,
      })
      throw new Error('Invalid or expired connection request')
    }
    await ctx.runMutation(internal.instagram.consumeConnectState, {
      state: args.state,
    })
    const redirectUri = `${getSiteUrl()}/api/webhooks/instagram/connect-callback`

    const tokenRes = await graphFetch<GraphTokenResponse>('oauth/access_token', {
      client_id: env.FACEBOOK_APP_ID!,
      client_secret: env.FACEBOOK_APP_SECRET!,
      redirect_uri: redirectUri,
      code: args.code,
    })
    const shortToken = tokenRes.access_token as string

    const longRes = await graphFetch<GraphTokenResponse>('oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: env.FACEBOOK_APP_ID!,
      client_secret: env.FACEBOOK_APP_SECRET!,
      fb_exchange_token: shortToken,
    })
    const longToken = longRes.access_token as string
    const expiresIn = (longRes.expires_in as number) ?? 60 * 24 * 60 * 60

    const accounts = await graphFetch<{ data?: GraphPage[] }>('me/accounts', {
      access_token: longToken,
      fields: 'id,name,instagram_business_account',
    })
    const pages = accounts.data ?? []
    const page = pages.find((p) => p.instagram_business_account)
    if (!page?.instagram_business_account) {
      throw new Error(
        'No Facebook Page linked to an Instagram Business/Creator account found. Connect the Instagram account to a Facebook Page first.',
      )
    }
    const igUserId = String(page.instagram_business_account.id)

    const igInfo = await graphFetch<{ username?: string }>(igUserId, {
      access_token: longToken,
      fields: 'id,username',
    })
    const igUsername = String(igInfo.username)

    await graphFetch<{ success?: boolean }>(
      `${igUserId}/subscribed_apps`,
      {
        access_token: longToken,
        subscribed_fields: 'media',
      },
      'POST',
    )

    const encrypted = await encryptToken(longToken, env.INSTAGRAM_ENCRYPTION_KEY!)
    await ctx.runMutation(internal.instagram.upsertConnection, {
      igUserId,
      igUsername,
      accessTokenEncrypted: encrypted,
      tokenExpiresAt: Date.now() + expiresIn * 1000,
      adminId: stateDoc.adminId,
    })
    return { igUsername, igUserId }
  },
})

export const publishToInstagram = action({
  args: { eventId: v.id('events'), caption: v.string() },
  handler: async (ctx, args) => {
    requireAppEnv()
    const profile = await ctx.runQuery(api.profiles.getMe)
    if (!profile) throw new Error('Not authenticated')
    if (profile.suspended || profile.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const conn = await ctx.runQuery(internal.instagram.getConnectionInternal)
    if (!conn) throw new Error('Instagram is not connected')
    if (!conn.autoPublish) throw new Error('Publishing to Instagram is disabled')
    if (conn.tokenExpiresAt < Date.now()) {
      throw new Error('Instagram access token expired — reconnect in Settings')
    }
    const token = await decryptToken(conn.accessTokenEncrypted, env.INSTAGRAM_ENCRYPTION_KEY!)

    const event = await ctx.runQuery(internal.instagram.getEventForPublish, {
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
      await ctx.runMutation(internal.instagram.logSync, {
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

    await ctx.runMutation(internal.instagram.markPublished, {
      eventId: args.eventId,
      instaPostId: publishedId,
      instaPermalink: permalink,
    })
    await ctx.runMutation(internal.instagram.logSync, {
      direction: 'out',
      status: 'success',
      eventId: args.eventId,
      igMediaId: publishedId,
    })
    return { ok: true, instaPostId: publishedId, instaPermalink: permalink }
  },
})

export const processWebhook = internalAction({
  args: { entry: v.any() },
  handler: async (ctx, args) => {
    requireAppEnv()
    const conn = await ctx.runQuery(internal.instagram.getConnectionInternal)
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
      const existing = await ctx.runQuery(internal.instagram.findEventByInstaPost, {
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
        await ctx.runMutation(internal.instagram.logSync, {
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
        await ctx.runMutation(internal.instagram.logSync, {
          direction: 'in',
          status: 'error',
          igMediaId: mediaId,
          message: 'No downloadable images for media',
        })
        continue
      }

      try {
        await ctx.runMutation(internal.instagram.createImportedEvent, {
          instaPostId: mediaId,
          instaPermalink: media.permalink ?? '',
          caption: media.caption ?? '',
          timestamp: media.timestamp ? Math.round(new Date(media.timestamp).getTime()) : Date.now(),
          images: urls,
        })
      } catch (e) {
        await ctx.runMutation(internal.instagram.logSync, {
          direction: 'in',
          status: 'error',
          igMediaId: mediaId,
          message: (e as Error).message,
        })
      }
    }
  },
})

export const checkTokens = internalAction({
  args: {},
  handler: async (ctx) => {
    const conn = await ctx.runQuery(internal.instagram.getConnectionInternal)
    if (!conn) return
    const msLeft = conn.tokenExpiresAt - Date.now()
    if (msLeft > 7 * 24 * 60 * 60 * 1000) return

    const admins = await ctx.runQuery(internal.instagram.listAdmins)
    const body =
      msLeft > 0
        ? 'The Instagram access token expires in less than 7 days. Reconnect from Settings.'
        : 'The Instagram access token has expired. Reconnect from Settings.'
    for (const admin of admins) {
      await ctx.runMutation(internal.instagram.notifyAdmin, {
        profileId: admin.profileId,
        type: 'instagram',
        title: 'Instagram connection expiring',
        body,
      })
    }
  },
})

export const upsertConnection = internalMutation({
  args: {
    igUserId: v.string(),
    igUsername: v.string(),
    accessTokenEncrypted: v.string(),
    tokenExpiresAt: v.number(),
    adminId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('instagramConnections').first()
    if (existing) {
      await ctx.db.patch(existing._id, { ...args })
      return existing._id
    }
    return await ctx.db.insert('instagramConnections', {
      igUserId: args.igUserId,
      igUsername: args.igUsername,
      accessTokenEncrypted: args.accessTokenEncrypted,
      tokenExpiresAt: args.tokenExpiresAt,
      syncEnabled: true,
      autoPublish: true,
      lastSyncedAt: undefined,
      connectedAt: Date.now(),
      adminId: args.adminId,
    })
  },
})

export const getConnectState = internalQuery({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('instagramConnectStates')
      .withIndex('by_state', (q) => q.eq('state', args.state))
      .first()
    if (!doc) return null
    return { adminId: doc.adminId, createdAt: doc.createdAt }
  },
})

export const consumeConnectState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('instagramConnectStates')
      .withIndex('by_state', (q) => q.eq('state', args.state))
      .first()
    if (doc) await ctx.db.delete('instagramConnectStates', doc._id)
  },
})

export const getConnectionInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const conn = await ctx.db.query('instagramConnections').first()
    if (!conn) return null
    return {
      igUserId: conn.igUserId,
      accessTokenEncrypted: conn.accessTokenEncrypted,
      tokenExpiresAt: conn.tokenExpiresAt,
      syncEnabled: conn.syncEnabled,
      autoPublish: conn.autoPublish,
    }
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

export const listAdmins = internalQuery({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db
      .query('profiles')
      .filter((q) => q.eq(q.field('role'), 'admin'))
      .take(50)
    return admins.map((p) => ({ profileId: p._id, email: p.email ?? null }))
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

export const notifyAdmin = internalMutation({
  args: {
    profileId: v.id('profiles'),
    type: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await insertNotification(ctx, {
      userId: args.profileId,
      type: args.type,
      title: args.title,
      body: args.body,
    })
  },
})
