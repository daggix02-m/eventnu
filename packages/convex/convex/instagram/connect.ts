import { v } from 'convex/values'
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
  MutationCtx,
  env,
} from '../_generated/server'
import { internal } from '../_generated/api'
import { insertNotification, requireAdmin } from '../helpers'
import { getSiteUrl, requireAppEnv, encryptToken } from './crypto'
import {
  graphFetch,
  GraphTokenResponse,
  GraphPage,
  randomState,
  CONNECT_STATE_TTL_MS,
} from './shared'

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
    const stateDoc = await ctx.runQuery(internal.instagram.connect.getConnectState, {
      state: args.state,
    })
    if (!stateDoc) {
      throw new Error('Invalid or expired connection request')
    }
    if (Date.now() - stateDoc.createdAt > CONNECT_STATE_TTL_MS) {
      await ctx.runMutation(internal.instagram.connect.consumeConnectState, {
        state: args.state,
      })
      throw new Error('Invalid or expired connection request')
    }
    await ctx.runMutation(internal.instagram.connect.consumeConnectState, {
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
    await ctx.runMutation(internal.instagram.connect.upsertConnection, {
      igUserId,
      igUsername,
      accessTokenEncrypted: encrypted,
      tokenExpiresAt: Date.now() + expiresIn * 1000,
      adminId: stateDoc.adminId,
    })
    return { igUsername, igUserId }
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

export const checkTokens = internalAction({
  args: {},
  handler: async (ctx) => {
    const conn = await ctx.runQuery(internal.instagram.connect.getConnectionInternal)
    if (!conn) return
    const msLeft = conn.tokenExpiresAt - Date.now()
    if (msLeft > 7 * 24 * 60 * 60 * 1000) return

    const admins = await ctx.runQuery(internal.instagram.connect.listAdmins)
    const body =
      msLeft > 0
        ? 'The Instagram access token expires in less than 7 days. Reconnect from Settings.'
        : 'The Instagram access token has expired. Reconnect from Settings.'
    for (const admin of admins) {
      await ctx.runMutation(internal.instagram.connect.notifyAdmin, {
        profileId: admin.profileId,
        type: 'instagram',
        title: 'Instagram connection expiring',
        body,
      })
    }
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
