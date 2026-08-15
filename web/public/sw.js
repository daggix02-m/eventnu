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
    url.hostname.includes('convex.site') ||
    url.searchParams.has('_rsc')
  ) {
    return
  }

  // Navigation requests (HTML pages) -> Network-first with cache/offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request)
          if (cachedResponse) return cachedResponse
          const offlinePage = await caches.match(OFFLINE_URL)
          return offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
        }),
    )
    return
  }

  // Static assets (images, fonts, scripts, styles) -> Stale-while-revalidate
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|woff2|woff|ttf|css|js)$/i)
  ) {
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
