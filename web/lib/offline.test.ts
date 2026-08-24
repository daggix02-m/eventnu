import { describe, it, expect, vi } from 'vitest'
import { OFFLINE_PROBE_URL, probeConnectivity } from './offline'

describe('probeConnectivity', () => {
  it('returns true when the probe request resolves (any HTTP response means online)', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }))
    await expect(probeConnectivity(fetchImpl)).resolves.toBe(true)
  })

  it('returns false when the probe request rejects (no network path)', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(probeConnectivity(fetchImpl)).resolves.toBe(false)
  })

  it('probes a service-worker-bypassed path with no-store so cached content cannot fake a connection', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }))
    await probeConnectivity(fetchImpl)
    expect(fetchImpl).toHaveBeenCalledWith(OFFLINE_PROBE_URL, { cache: 'no-store' })
  })
})
