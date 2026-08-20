import { httpRouter } from 'convex/server'
import { httpAction, env } from './_generated/server'
import { api, internal } from './_generated/api'
import { auth } from './auth'

const http = httpRouter()

auth.addHttpRoutes(http)

const WEBHOOK_PATH = '/api/webhooks/instagram'

async function validSignature(header: string, body: string, secret: string): Promise<boolean> {
  const [algo, expected] = header.split('=')
  if (algo !== 'sha256' || !expected) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const hex = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
  if (hex.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

http.route({
  path: WEBHOOK_PATH,
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const verifyToken = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && verifyToken === env.INSTAGRAM_VERIFY_TOKEN && challenge) {
      return new Response(challenge)
    }
    return new Response('Forbidden', { status: 403 })
  }),
})

http.route({
  path: WEBHOOK_PATH,
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const raw = await req.text()
    const signature = req.headers.get('X-Hub-Signature-256') ?? ''
    if (!env.FACEBOOK_APP_SECRET) {
      return new Response('Not configured', { status: 503 })
    }
    if (!(await validSignature(signature, raw, env.FACEBOOK_APP_SECRET))) {
      return new Response('Invalid signature', { status: 401 })
    }
    let body: { object?: string; entry?: unknown[] } | undefined
    try {
      body = JSON.parse(raw)
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }
    if (body?.object !== 'instagram' || !Array.isArray(body?.entry)) {
      return new Response('OK', { status: 200 })
    }
    for (const entry of body.entry) {
      await ctx.scheduler.runAfter(0, internal.instagram.import.processWebhook, {
        entry,
      })
    }
    return new Response('OK', { status: 200 })
  }),
})

http.route({
  path: `${WEBHOOK_PATH}/connect-callback`,
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const adminAppUrl = env.ADMIN_APP_URL ?? ''

    let redirectBase = ''
    if (adminAppUrl !== '') {
      try {
        const parsed = new URL(adminAppUrl)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          redirectBase = parsed.toString().replace(/\/$/, '')
        }
      } catch {
        redirectBase = ''
      }
    }

    const redirect = (search: string) =>
      new Response(null, {
        status: 302,
        headers: {
          Location: redirectBase ? `${redirectBase}/settings${search}` : '/',
        },
      })

    const error = url.searchParams.get('error')
    if (error || !code || !state) {
      return redirect('?instagram=error')
    }
    try {
      await ctx.runAction(api.instagram.connect.completeConnect, { code, state })
      return redirect('?instagram=connected')
    } catch (e) {
      console.error('Instagram OAuth callback error:', e)
      return redirect('?instagram=error')
    }
  }),
})

export default http
