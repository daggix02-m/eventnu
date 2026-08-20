import { ActionCtx } from '../_generated/server'
import { MAX_EVENT_IMAGES } from '../constants'

export const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

export interface GraphTokenResponse {
  access_token?: string
  expires_in?: number
}

export interface GraphPage {
  id: string
  name?: string
  instagram_business_account?: { id: string }
}

export interface GraphMedia {
  id: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  caption?: string
  permalink?: string
  timestamp?: string
  children?: { data?: GraphMedia[] }
}

export interface GraphWebhookEntry {
  changes?: { field?: string; value?: { id?: string } }[]
  field?: string
  value?: { id?: string }
}

export async function graphFetch<T = unknown>(
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

export function captionParts(caption: string): { title: string; description: string } {
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

const INSTAGRAM_CDN_HOSTS = ['scontent-', 'cdninstagram.com', 'fbcdn.net']
const MAX_REMOTE_IMAGE_BYTES = 20 * 1024 * 1024

export async function storeRemoteImage(
  ctx: ActionCtx,
  url: string,
): Promise<{ url: string; storageId: string } | null> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    const host = parsed.hostname
    const isAllowed = INSTAGRAM_CDN_HOSTS.some(
      (h) => host.endsWith(`.${h}`) || host.startsWith(h.replace('-', '')) || host === h,
    )
    if (!isAllowed) return null
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) return null
    const contentLength = Number(res.headers.get('content-length') ?? 0)
    if (contentLength > MAX_REMOTE_IMAGE_BYTES) return null
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_REMOTE_IMAGE_BYTES) return null
    const storageId = await ctx.storage.store(new Blob([buf]))
    const storedUrl = await ctx.storage.getUrl(storageId)
    return storedUrl ? { url: storedUrl, storageId } : null
  } catch {
    return null
  }
}

export function randomState(): string {
  return crypto.randomUUID()
}

export const CONNECT_STATE_TTL_MS = 10 * 60 * 1000
