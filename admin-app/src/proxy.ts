import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

const isPublicAuthRoute = createRouteMatcher([
  '/auth/sign-in',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
])

const isProtectedRoute = createRouteMatcher(['/((?!auth|_next/static|_next/image|favicon.ico).*)'])

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.convex.cloud https://*.convex.site",
    "font-src 'self' data:",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    `report-uri /api/csp-report`,
  ].join('; ')
}

const authMiddleware = convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated()

    if (isPublicAuthRoute(request) && isAuthenticated) {
      return nextjsMiddlewareRedirect(request, '/')
    }

    if (isProtectedRoute(request) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(request, '/auth/sign-in')
    }
  },
  { cookieConfig: { maxAge: 60 * 60 * 24 * 30 } },
)

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const nextRequest = new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  })

  const response = await authMiddleware(nextRequest, event)
  if (!response) {
    const res = NextResponse.next()
    res.headers.set('Content-Security-Policy', csp)
    return res
  }
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
