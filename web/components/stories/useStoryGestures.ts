'use client'

import { useCallback, useRef } from 'react'

// --- Constants ---
/** Minimum horizontal distance (px) to classify as a swipe. */
const SWIPE_THRESHOLD = 40
/** Minimum downward distance (px) to close the viewer. */
const CLOSE_THRESHOLD = 80
/** Minimum upward distance (px) to open the viewer list sheet. */
const VIEWER_SHEET_THRESHOLD = 100
/** Below this distance the touch is a tap, not a swipe. */
const TAP_MAX_DISTANCE = 10
/** Below this duration the touch is a tap. */
const TAP_MAX_DURATION = 200
/** Long-press duration before pause fires. */
const LONG_PRESS_DELAY = 300

// --- Types ---
interface TouchState {
  startX: number
  startY: number
  startTime: number
  active: boolean
}

export interface DragOffset {
  x: number
  y: number
  active: boolean
}

interface UseStoryGesturesOptions {
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onShowViewers: () => void
  onTap: () => void
  onLongPress: () => void
  /** When false all gesture handlers are no-ops (e.g. viewer sheet is open). */
  enabled: boolean
}

export interface UseStoryGesturesReturn {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  /** Apply visual feedback to a DOM element during an active drag. */
  applyDragFeedback: (el: HTMLElement) => void
  /** Reset the element after a drag ends or is cancelled. */
  resetDragFeedback: (el: HTMLElement) => void
  /** Whether a long-press is currently active (for pause state). */
  longPressedRef: React.MutableRefObject<boolean>
}

function haptic() {
  try {
    navigator.vibrate?.(8)
  } catch {
    /* vibration unsupported */
  }
}

/**
 * Unified touch gesture classifier for the StoryViewer.
 *
 * Tracks both axes simultaneously, classifies on touchEnd, and provides
 * real-time drag offset for visual feedback without React re-renders.
 *
 * Usage:
 * 1. Spread `onTouchStart`, `onTouchMove`, `onTouchEnd` onto the container.
 * 2. In your `onTouchMove` handler (or a rAF loop), call `applyDragFeedback(el)`.
 * 3. In `onTouchEnd`, if no gesture was triggered, call `resetDragFeedback(el)`.
 */
export function useStoryGestures({
  onPrev,
  onNext,
  onClose,
  onShowViewers,
  onTap,
  onLongPress,
  enabled,
}: UseStoryGesturesOptions): UseStoryGesturesReturn {
  const touchRef = useRef<TouchState>({ startX: 0, startY: 0, startTime: 0, active: false })
  const dragOffsetRef = useRef<DragOffset>({ x: 0, y: 0, active: false })
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      const touch = e.touches[0]
      touchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        active: true,
      }
      longPressedRef.current = false

      // Start long-press timer
      clearLongPress()
      longPressTimer.current = setTimeout(() => {
        longPressedRef.current = true
        onLongPress()
      }, LONG_PRESS_DELAY)
    },
    [enabled, onLongPress, clearLongPress],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchRef.current.active) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchRef.current.startX
      const dy = touch.clientY - touchRef.current.startY

      // Cancel long-press if finger moved significantly
      if (Math.abs(dx) > TAP_MAX_DISTANCE || Math.abs(dy) > TAP_MAX_DISTANCE) {
        clearLongPress()
      }

      // Update drag offset (ref, no re-render)
      dragOffsetRef.current = { x: dx, y: dy, active: true }
    },
    [enabled, clearLongPress],
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchRef.current.active) return

      clearLongPress()

      // If long-press fired, don't classify as tap/swipe
      if (longPressedRef.current) {
        longPressedRef.current = false
        touchRef.current.active = false
        dragOffsetRef.current = { x: 0, y: 0, active: false }
        return
      }

      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchRef.current.startX
      const dy = touch.clientY - touchRef.current.startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const duration = Date.now() - touchRef.current.startTime

      touchRef.current.active = false
      dragOffsetRef.current = { x: 0, y: 0, active: false }

      // --- Classification ---
      // Tap: small distance + fast
      if (absDx < TAP_MAX_DISTANCE && absDy < TAP_MAX_DISTANCE && duration < TAP_MAX_DURATION) {
        onTap()
        return
      }

      // Horizontal swipe dominates
      if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
        haptic()
        if (dx < 0) onNext()
        else onPrev()
        return
      }

      // Vertical swipe dominates — downward → close
      if (absDy > absDx && absDy > CLOSE_THRESHOLD && dy > 0) {
        haptic()
        onClose()
        return
      }

      // Vertical swipe dominates — upward → viewer list
      if (absDy > absDx && absDy > VIEWER_SHEET_THRESHOLD && dy < 0) {
        haptic()
        onShowViewers()
        return
      }

      // Diagonal or below threshold — ignore (spring-back handled by caller)
    },
    [enabled, onPrev, onNext, onClose, onShowViewers, onTap, clearLongPress],
  )

  /**
   * Apply visual transform to a DOM element during an active drag.
   * Call from a requestAnimationFrame loop or directly in onTouchMove.
   */
  const applyDragFeedback = useCallback((el: HTMLElement) => {
    const offset = dragOffsetRef.current
    if (!offset.active) return
    el.style.transition = 'none'
    el.style.transform = `translate(${offset.x * 0.3}px, ${offset.y * 0.5}px)`
    el.style.opacity = `${Math.max(0.3, 1 - Math.abs(offset.y) / (window.innerHeight * 0.6))}`
  }, [])

  /** Spring-back to origin after drag ends without triggering an action. */
  const resetDragFeedback = useCallback((el: HTMLElement) => {
    el.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out'
    el.style.transform = 'translate(0, 0)'
    el.style.opacity = '1'
  }, [])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    applyDragFeedback,
    resetDragFeedback,
    longPressedRef,
  }
}
