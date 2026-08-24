import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { OfflineBanner } from './OfflineBanner'
import { OFFLINE_REPROBE_MS } from '@/lib/offline'

const fetchMock = vi.fn()
const OFFLINE_TEXT = /you're offline/i

function setOnLine(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    setOnLine(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setOnLine(true)
  })

  it('renders nothing when the browser reports online', () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
    render(<OfflineBanner />)
    expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument()
  })

  it('does not show the banner when navigator.onLine is false at mount but connectivity works', async () => {
    // Regression: iOS Safari / standalone PWA often report navigator.onLine === false
    // at launch even with a live connection, and the `online` event may never fire.
    setOnLine(false)
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    render(<OfflineBanner />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument()
  })

  it('shows the banner only when offline and the connectivity probe fails', async () => {
    setOnLine(false)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    render(<OfflineBanner />)

    await waitFor(() => {
      expect(screen.getByText(OFFLINE_TEXT)).toBeInTheDocument()
    })
  })

  it('hides the banner when the online event fires', async () => {
    setOnLine(false)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    render(<OfflineBanner />)
    await waitFor(() => {
      expect(screen.getByText(OFFLINE_TEXT)).toBeInTheDocument()
    })

    setOnLine(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument()
    })
  })

  it('clears a stale banner when a periodic re-probe succeeds (missed online event)', async () => {
    vi.useFakeTimers()
    try {
      setOnLine(false)
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValue(new Response(null, { status: 404 }))

      render(<OfflineBanner />)

      // Flush the initial probe (rejects) → banner shows.
      await act(async () => {})
      expect(screen.getByText(OFFLINE_TEXT)).toBeInTheDocument()

      // Connectivity returns but the browser never fires `online`; the banner
      // must self-heal on the next re-probe instead of staying stuck.
      await act(async () => {
        vi.advanceTimersByTime(OFFLINE_REPROBE_MS + 1000)
      })

      expect(screen.queryByText(OFFLINE_TEXT)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
