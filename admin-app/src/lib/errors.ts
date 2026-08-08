export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (err instanceof Error) {
    const msg = err.message || ''
    if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your connection and try again.'
    }
    if (msg.includes('Could not connect to the Convex deployment')) {
      return 'The server is temporarily unavailable. Please try again shortly.'
    }
    if (msg.includes('Unauthorized') || msg.includes('401')) {
      return 'Your session has expired. Please sign in again.'
    }
    if (msg.includes('Forbidden') || msg.includes('403')) {
      return 'You do not have permission to perform this action.'
    }
    if (msg.includes('Not Found') || msg.includes('404')) {
      return 'The requested resource was not found.'
    }
    return msg || fallback
  }
  if (typeof err === 'string') {
    return err || fallback
  }
  return fallback
}
