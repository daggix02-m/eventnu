'use client'

import * as React from 'react'

export interface MeasureBounds {
  width: number
  height: number
}

/**
 * Observe an element's box size via ResizeObserver. Returns a callback ref and
 * the latest `{ width, height }` bounds (0 until the first measurement).
 */
export function useMeasure<T extends HTMLElement>(): [React.RefCallback<T>, MeasureBounds] {
  const [bounds, setBounds] = React.useState<MeasureBounds>({ width: 0, height: 0 })

  const observerRef = React.useRef<ResizeObserver | null>(null)

  const ref = React.useCallback((node: T | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (node) {
      observerRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setBounds({ width, height })
        }
      })
      observerRef.current.observe(node)
    }
  }, [])

  React.useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  return [ref, bounds]
}
