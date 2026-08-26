import 'server-only'

import { ConvexHttpClient } from 'convex/browser'

export function createPublicClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Environment variable NEXT_PUBLIC_CONVEX_URL is not set.')
  // Cache the Convex response in Next's Data Cache but revalidate on the same
  // schedule as the ISR routes (`revalidate = 300`). `cache: 'force-cache'`
  // would cache indefinitely — route segment `revalidate` does not override an
  // explicit fetch cache setting — leaving stale event data served forever.
  const cachedFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, next: { revalidate: 300 } })
  return new ConvexHttpClient(url, { fetch: cachedFetch })
}
