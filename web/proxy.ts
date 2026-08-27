import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

// Align the auth cookie lifetime with Convex Auth's 30-day server-side
// session default so sessions persist across browser restarts.
const cookieConfig = { maxAge: 60 * 60 * 24 * 30 }

const authMiddleware = convexAuthNextjsMiddleware(undefined, { cookieConfig })

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = await authMiddleware(request, event)
  if (!response) return NextResponse.next()
  return response
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
