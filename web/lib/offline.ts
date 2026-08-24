/**
 * Connectivity helpers for the offline banner.
 *
 * The service worker serves cached pages offline, so a naive "can I fetch
 * /" probe would always succeed from cache. These helpers probe a path the
 * service worker deliberately ignores (`/api/*`, see public/sw.js) with
 * `cache: 'no-store'` — any real response proves a network path exists, and
 * only a rejected request means the device is actually offline.
 */

export const OFFLINE_PROBE_URL = '/api/health'
export const OFFLINE_REPROBE_MS = 5000

export async function probeConnectivity(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    await fetchImpl(OFFLINE_PROBE_URL, { cache: 'no-store' })
    return true
  } catch {
    return false
  }
}
