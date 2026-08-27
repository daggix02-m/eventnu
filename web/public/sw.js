const CACHE_NAME = 'eventnu-cache-v4'
const OFFLINE_URL = '/offline.html'

// Core shell always precached, independent of the build-generated manifest.
const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/logo.png',
  '/app-icon.png',
  '/manifest.webmanifest',
]

// Hard cap on cache entries so low-end Android devices never grow the cache
// without bound (each /_next/image variant is a distinct entry).
const MAX_CACHE_ENTRIES = 150

async function openCache() {
  return await caches.open(CACHE_NAME)
}

async function trimCache(cache) {
  const keys = await cache.keys()
  if (keys.length <= MAX_CACHE_ENTRIES) return
  const excess = keys.length - MAX_CACHE_ENTRIES
  await Promise.all(keys.slice(0, excess).map((request) => cache.delete(request)))
}

async function precache(urls) {
  if (!urls || urls.length === 0) return
  const cache = await openCache()
  // addAll fails the whole batch on one 404 — add individually so one stale
  // manifest entry can't block the rest.
  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url)
        if (response.ok) await cache.put(url, response)
      } catch {
        // skip unreachable assets
      }
    }),
  )
}

// Install event - precache core shell + the build-generated JS/CSS/font
// manifest (if present). Content-hashed chunks are immutable, so this makes
// repeat visits instant.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await openCache()
      await Promise.allSettled(
        CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url)
            if (response.ok) await cache.put(url, response)
          } catch {
            // ignore
          }
        }),
      )
      try {
        const manifestResponse = await fetch('/sw-precache.json')
        if (manifestResponse.ok) {
          const urls = await manifestResponse.json()
          await precache(urls)
        }
      } catch {
        // no manifest (e.g. dev) — shell is already cached
      }
      await self.skipWaiting()
    })(),
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// Fetch event - network-first with offline fallback for navigation, cache-first
// for immutable hashed chunks, stale-while-revalidate for other static assets.
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
  const isHashedStatic = url.pathname.startsWith('/_next/static/')
  const isOtherStatic =
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i)

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
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(cacheKey, responseClone))
              .catch(() => {})
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

  // Content-hashed chunks + fonts are immutable: serve from cache first and
  // refresh in the background. This is what makes repeat visits fast.
  if (isHashedStatic) {
    event.respondWith(
      caches.match(request).then(async (cachedResponse) => {
        if (cachedResponse) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                return caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(request, networkResponse).then(() => trimCache(cache)))
              }
            })
            .catch(() => {
              // Background refresh failed; the cached copy is still served.
            })
          return cachedResponse
        }
        try {
          const networkResponse = await fetch(request)
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone).then(() => trimCache(cache)))
              .catch(() => {})
          }
          return networkResponse
        } catch {
          return Response.error()
        }
      }),
    )
    return
  }

  // Other static assets (images) -> stale-while-revalidate
  if (isOtherStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone()
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone).then(() => trimCache(cache)))
                .catch(() => {})
            }
            return networkResponse
          })
          .catch(() => cachedResponse || Response.error())

        return cachedResponse || fetchPromise
      }),
    )
  }
})