/**
 * Map story publish errors to user-friendly strings.
 *
 * Handles three error shapes:
 * 1. Structured ConvexError data objects (e.g. @convex-dev/rate-limiter)
 *    — err.data = { kind: "RateLimited", name: "storyPublish", retryAfter: ... }
 * 2. Stringified ConvexError messages (JSON-stringified objects)
 *    — err.message = '{"kind":"RateLimited",...}'
 * 3. Plain string messages from ConvexError('...') or Error('...')
 *    — err.message = "Not authenticated"
 */
export function describeStoryError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message

    // ── ConvexError structured data (e.g. @convex-dev/rate-limiter) ──────
    // When thrown with an object, ConvexError.message is the JSON-stringified
    // version, while .data holds the original object.
    const data = (err as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const kind = (data as Record<string, unknown>).kind
      if (kind === 'RateLimited') {
        return 'Too many stories posted. Please try again later.'
      }
    }

    // ── ConvexError string messages ──────────────────────────────────────
    if (msg.includes('Not authenticated')) return 'Please sign in to share a story.'
    if (msg.includes('Account suspended'))
      return 'Your account has been suspended. Please contact support.'
    if (msg.includes('Caption must be'))
      return 'Caption is too long. Please keep it under 500 characters.'
    if (msg.includes('Event not found')) return 'The tagged event could not be found.'
    if (msg.includes('Uploaded file not found') || msg.includes('Thumbnail file not found'))
      return 'Media upload failed. Please try again.'
    if (msg.includes('must be an image') || msg.includes('must be a video'))
      return 'Invalid file type. Please select the correct media format.'

    // ── Rate limit (fallback for any format) ─────────────────────────────
    if (msg.includes('rate limit') || msg.includes('RateLimited') || msg.includes('Too many'))
      return 'Too many stories posted. Please try again later.'

    // ── Upload / network errors ──────────────────────────────────────────
    if (msg.includes('Upload failed')) return 'Media upload failed. Please try again.'
    if (
      msg.includes('Could not connect') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed') ||
      msg.includes('NetworkError')
    )
      return 'Could not reach the server. Check your connection and try again.'
  }
  return 'Failed to publish your story. Please try again.'
}
