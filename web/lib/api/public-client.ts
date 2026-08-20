import 'server-only'

import { ConvexHttpClient } from 'convex/browser'

export function createPublicClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Environment variable NEXT_PUBLIC_CONVEX_URL is not set.')
  const cachedFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'force-cache' })
  return new ConvexHttpClient(url, { fetch: cachedFetch })
}
