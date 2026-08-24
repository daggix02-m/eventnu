const CACHE_NAME = 'eventnu-cache-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
]

// Install event - precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Precache asset fetch warning:', err)
        })
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - network-first with offline fallback for navigation, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // Skip Convex API, auth endpoints, Next.js server actions, and analytics
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('convex.cloud') ||
    url.hostname.includes('convex.site')
  ) {
    return
  }

  const isNavigation = request.mode === 'navigate'
  const isRsc = url.searchParams.has('_rsc')
  const isStaticAsset =
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|woff2|woff|ttf|css|js)$/i)

  // Navigation + RSC payloads (client-side route transitions) share a strategy:
  // network-first with cache fallback, so offline navigation is instant instead
  // of flashing a loading skeleton. Cache keys are normalized to the pathname —
  // query strings (`/schedule?date=X`) and the rotating `_rsc` nonce would
  // otherwise grow the cache without bound on low-end Android devices.
  if (isNavigation || isRsc) {
    const cacheKey = url.pathname
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, responseClone))
          }
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(cacheKey)
          if (cachedResponse) return cachedResponse
          if (isRsc) {
            // Let the Next.js router fall back to a full (cached) navigation.
            return new Response('', {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          const offlinePage = await caches.match(OFFLINE_URL)
          return (
            offlinePage ||
            new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          )
        }),
    )
    return
  }

  // Static assets (images, fonts, scripts, styles) -> Stale-while-revalidate
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      }),
    )
  }
})