import { ConvexError } from 'convex/values'

/**
 * Convert a known auth failure (thrown as a plain Error by the
 * @convex-dev/auth runtime) into a `ConvexError` whose message survives
 * Convex's production error redaction and reaches the web client. The web
 * client's `describeError` maps these exact strings to user-facing messages.
 *
 * Unknown errors and non-Error thrown values are passed through unchanged so
 * their original message (and any existing `ConvexError`) is preserved.
 */
export function toClientAuthError(error: unknown): unknown {
  if (!(error instanceof Error)) return error
  // Internal-mutation failures reach this wrapper with a noisy message like
  // "Uncaught Error: Account x@y.com already exists\n    at ..." in both dev
  // and prod. Normalize to the first meaningful line before matching.
  const firstLine = (error.message.split('\n')[0] ?? error.message).replace(/^Uncaught Error: /, '')
  if (firstLine === 'InvalidAccountId' || firstLine === 'InvalidSecret') {
    return new ConvexError('Invalid credentials')
  }
  if (firstLine === 'TooManyFailedAttempts') {
    return new ConvexError('TooManyFailedAttempts')
  }
  if (firstLine.includes('already exists')) {
    return new ConvexError(firstLine)
  }
  return error
}
