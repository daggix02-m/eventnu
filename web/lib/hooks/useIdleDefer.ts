import { useEffect, useState } from 'react'

type IdleCallbackWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }

/**
 * Returns `true` only after the browser has reported idle (with a hard cap so
 * the value always flips on busy tabs). Use it to defer heavy, non-critical
 * work — e.g. fetching the WebGL chunk or firing secondary data queries —
 * until after the initial page load has settled, keeping LCP resources first.
 */
export function useIdleDefer(timeout = 2000): boolean {
  const [deferred, setDeferred] = useState(false)

  useEffect(() => {
    const idleWindow = window as IdleCallbackWindow
    let handle: number | undefined
    let fallbackTimer: number | undefined
    if (typeof idleWindow.requestIdleCallback === 'function') {
      handle = idleWindow.requestIdleCallback(() => setDeferred(true), { timeout })
    } else {
      fallbackTimer = window.setTimeout(() => setDeferred(true), timeout)
    }
    return () => {
      if (handle !== undefined) idleWindow.cancelIdleCallback?.(handle)
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
    }
  }, [timeout])

  return deferred
}
