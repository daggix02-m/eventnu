import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'
import { fetchAction } from 'convex/nextjs'
import type { FunctionReference } from 'convex/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

const AUTH_ROUTE = '/api/auth'
const cookieConfig = { maxAge: 60 * 60 * 12 }

const authMiddleware = convexAuthNextjsMiddleware(undefined, { cookieConfig })

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com https://*.convex.cloud https://*.convex.site",
    "font-src 'self' data:",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://nominatim.openstreetmap.org",
    "frame-src 'self' https://www.openstreetmap.org",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    `report-uri /api/csp-report`,
  ].join('; ')
}

/* ---------------------------------------------------------------------------
 * Auth proxy
 *
 * Faithful port of `proxyAuthActionToConvex` from `@convex-dev/auth/nextjs`
 * (v0.0.94) with one difference: when the Convex `auth:signIn` action fails
 * with a `ConvexError`, we surface its `data` (a readable message mapped in
 * `convex/authErrors.ts`) instead of the redacted "Server Error" text that
 * Convex puts in `error.message`.
 *
 * Handled here directly so the web app can show actionable auth errors.
 * Everything else (token refresh, code exchange, OAuth callbacks) is left to
 * `convexAuthNextjsMiddleware`.
 * ------------------------------------------------------------------------- */

function shouldProxyAuthAction(request: NextRequest): boolean {
  const pathname = new URL(request.url).pathname
  return pathname === AUTH_ROUTE || pathname === `${AUTH_ROUTE}/`
}

function isCorsRequest(request: NextRequest): boolean {
  const origin = request.headers.get('Origin')
  const originURL = origin ? new URL(origin) : null
  return (
    originURL !== null &&
    (originURL.host !== request.headers.get('Host') ||
      originURL.protocol !== new URL(request.url).protocol)
  )
}

function isLocalHost(host: string): boolean {
  return /(localhost|127\.0\.0\.1):\d+/.test(host)
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

async function proxyAuthActionToConvex(request: NextRequest) {
  if (request.method !== 'POST') {
    return new Response('Invalid method', { status: 405 })
  }
  if (isCorsRequest(request)) {
    return new Response('Invalid origin', { status: 403 })
  }
  const { action, args } = (await request.json()) as {
    action: string
    args: Record<string, unknown> & {
      refreshToken?: string
      params?: { code?: string }
      verifier?: string
    }
  }
  if (action !== 'auth:signIn' && action !== 'auth:signOut') {
    return new Response('Invalid action', { status: 400 })
  }

  const localhost = isLocalHost(request.headers.get('Host') ?? '')
  const prefix = localhost ? '' : '__Host-'
  const tokenName = `${prefix}__convexAuthJWT`
  const refreshTokenName = `${prefix}__convexAuthRefreshToken`
  const verifierName = `${prefix}__convexAuthOAuthVerifier`
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: !localhost,
  }

  const setAuthCookie = (response: NextResponse, name: string, value: string | null) => {
    if (value === null) {
      response.cookies.set(name, '', {
        ...cookieOptions,
        maxAge: undefined,
        expires: 0,
      })
    } else {
      response.cookies.set(name, value, {
        ...cookieOptions,
        maxAge: cookieConfig.maxAge,
      })
    }
  }

  const clearAuthCookies = (response: NextResponse) => {
    setAuthCookie(response, tokenName, null)
    setAuthCookie(response, refreshTokenName, null)
    setAuthCookie(response, verifierName, null)
  }

  const setAuthCookies = (
    response: NextResponse,
    tokens: { token: string; refreshToken: string } | null,
  ) => {
    if (tokens === null) {
      clearAuthCookies(response)
    } else {
      setAuthCookie(response, tokenName, tokens.token)
      setAuthCookie(response, refreshTokenName, tokens.refreshToken)
      setAuthCookie(response, verifierName, null)
    }
  }

  let token: string | undefined
  if (action === 'auth:signIn' && args.refreshToken !== undefined) {
    // The client has a dummy refreshToken, the real one is only stored in cookies.
    const refreshToken = request.cookies.get(refreshTokenName)?.value ?? null
    if (refreshToken === null) {
      console.error('Convex Auth: Unexpected missing refreshToken cookie during client refresh')
      return jsonResponse({ tokens: null })
    }
    args.refreshToken = refreshToken
  } else {
    token = request.cookies.get(tokenName)?.value ?? undefined
  }

  if (action === 'auth:signIn') {
    // Do not require auth when refreshing tokens or validating a code since
    // they are steps in the auth flow.
    const needsToken = args.refreshToken === undefined && args.params?.code === undefined
    try {
      const result = await fetchAction(action as unknown as FunctionReference<'action'>, args, {
        ...(needsToken ? { token } : {}),
      })
      if (result.redirect !== undefined) {
        const response = jsonResponse({ redirect: result.redirect })
        setAuthCookie(response, verifierName, String(result.verifier ?? ''))
        return response
      }
      if (result.tokens !== undefined) {
        // The server never shares the refresh token with the client; it is
        // only stored in cookies.
        const response = jsonResponse({
          tokens:
            result.tokens !== null ? { token: result.tokens.token, refreshToken: 'dummy' } : null,
        })
        setAuthCookies(response, result.tokens)
        return response
      }
      return jsonResponse(result)
    } catch (error) {
      console.error('Hit error while running `auth:signIn`:')
      console.error(error)
      // ConvexError data carries the readable message (see convex/authErrors.ts).
      const message =
        typeof (error as { data?: unknown } | null)?.data === 'string'
          ? ((error as { data: string }).data as string)
          : error instanceof Error
            ? error.message
            : 'Something went wrong'
      const response = jsonResponse({ error: message }, 400)
      clearAuthCookies(response)
      return response
    }
  }

  // auth:signOut
  try {
    await fetchAction(action as unknown as FunctionReference<'action'>, args, { token })
  } catch (error) {
    console.error('Hit error while running `auth:signOut`:')
    console.error(error)
  }
  const response = jsonResponse(null)
  clearAuthCookies(response)
  return response
}

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

  const response = shouldProxyAuthAction(nextRequest)
    ? await proxyAuthActionToConvex(nextRequest)
    : await authMiddleware(nextRequest, event)
  if (!response) return NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
