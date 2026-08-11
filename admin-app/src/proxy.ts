import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server'

const isPublicAuthRoute = createRouteMatcher([
  '/auth/sign-in',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
])

const isProtectedRoute = createRouteMatcher(['/((?!auth|_next/static|_next/image|favicon.ico).*)'])

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated()

    if (isPublicAuthRoute(request) && isAuthenticated) {
      return nextjsMiddlewareRedirect(request, '/')
    }

    if (isProtectedRoute(request) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(request, '/auth/sign-in')
    }
  },
  { cookieConfig: { maxAge: 60 * 60 * 12 } },
)

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
