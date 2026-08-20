/**
 * Structured logger that strips sensitive data from error output.
 * Replace all console.error/console.log in production paths with this.
 *
 * In development, full error details are logged.
 * In production, only the message is logged (no stack traces or internal details).
 */
export function logError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, err)
  } else {
    // Production: log only the message, never stack traces or internal details
    console.error(`[${context}] ${message}`)
  }
}
