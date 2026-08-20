import { NextRequest, NextResponse } from 'next/server'

/**
 * CSP Violation Report endpoint.
 * Receives Content-Security-Policy violation reports from browsers.
 * In production, pipe these to a monitoring service (e.g., Sentry, Datadog).
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json()
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', JSON.stringify(report, null, 2))
    }
  } catch {
    // Ignore malformed reports
  }
  return new NextResponse(null, { status: 204 })
}
