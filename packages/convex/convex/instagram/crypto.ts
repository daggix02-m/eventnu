import { env } from '../_generated/server'

export function getSiteUrl(): string {
  const e = env as unknown as Record<string, string | undefined>
  return e.CONVEX_SITE_URL ?? ''
}

export function requireAppEnv() {
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

export async function encryptToken(plain: string, keyStr: string): Promise<string> {
  const key = await getCryptoKey(keyStr)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  return toHex(iv.buffer) + '.' + toHex(cipher)
}

export async function decryptToken(payload: string, keyStr: string): Promise<string> {
  const [ivHex, dataHex] = payload.split('.')
  const key = await getCryptoKey(keyStr)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromHex(ivHex) },
    key,
    fromHex(dataHex).buffer,
  )
  return new TextDecoder().decode(plain)
}
