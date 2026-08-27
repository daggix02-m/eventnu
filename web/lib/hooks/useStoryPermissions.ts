'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type PermissionName = 'camera' | 'microphone' | 'geolocation'
export type PermissionState = 'unknown' | 'granted' | 'denied' | 'unavailable'

export interface StoryPermissions {
  camera: PermissionState
  microphone: PermissionState
  geolocation: PermissionState
  /** True once the native prompts have been answered at least once this session. */
  requested: boolean
  /** Friendly reason for a failed permission, keyed by the failing permission. */
  error: Record<PermissionName, string | null>
  /** Prompts for camera (+mic in the same call). Returns the granted stream —
   * ownership transfers to the caller, who must stop its tracks on teardown. */
  requestCamera: () => Promise<MediaStream | null>
  requestMicrophone: () => Promise<boolean>
  requestGeolocation: () => Promise<{ latitude: number; longitude: number } | null>
  release: () => void
}

const SEEN_KEY = 'eventnu_camera_permission_seen'

function geolocationErrorToMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as GeolocationPositionError).code
    if (code === GeolocationPositionError.PERMISSION_DENIED) {
      return 'Location access was denied. Enable it in Safari Settings to tag your story.'
    }
    if (code === GeolocationPositionError.POSITION_UNAVAILABLE) {
      return 'Location is temporarily unavailable. You can publish without a location.'
    }
    if (code === GeolocationPositionError.TIMEOUT) {
      return 'Location request timed out. You can publish without a location.'
    }
  }
  return 'Location could not be determined.'
}

/**
 * Story-capture permissions state machine.
 *
 * Camera (photo) and microphone (video) are requested through a single
 * `getUserMedia` call so iOS Safari shows one prompt for both. Geolocation is
 * requested separately, lazily, when the user opts into tagging a location.
 * First-run UX: callers should show the explainer interstitial before the first
 * `request*` call — this hook tracks that via localStorage so it only fires once.
 */
export function useStoryPermissions(): StoryPermissions {
  const [camera, setCamera] = useState<PermissionState>('unknown')
  const [microphone, setMicrophone] = useState<PermissionState>('unknown')
  const [geolocation, setGeolocation] = useState<PermissionState>('unknown')
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState<Record<PermissionName, string | null>>({
    camera: null,
    microphone: null,
    geolocation: null,
  })

  const streamsRef = useRef<MediaStream[]>([])

  const stopTracks = useCallback(() => {
    for (const stream of streamsRef.current) {
      for (const track of stream.getTracks()) track.stop()
    }
    streamsRef.current = []
  }, [])

  const requestCamera = useCallback(async (): Promise<MediaStream | null> => {
    setError((e) => ({ ...e, camera: null }))
    if (camera === 'denied') return null
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable')
      setError((e) => ({ ...e, camera: 'Camera is not available in this browser.' }))
      return null
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      setCamera('granted')
      setMicrophone((m) => (m === 'unknown' ? 'granted' : m))
      setRequested(true)
      try {
        localStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* storage unavailable */
      }
      return stream
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCamera('denied')
        setMicrophone('denied')
        setError((e) => ({
          ...e,
          camera: 'Camera and microphone access was denied. Enable them in Safari Settings.',
        }))
      } else if (name === 'NotFoundError') {
        setCamera('unavailable')
        setError((e) => ({ ...e, camera: 'No camera was found on this device.' }))
      } else if (name === 'NotReadableError') {
        setCamera('unavailable')
        setError((e) => ({ ...e, camera: 'The camera is in use by another app.' }))
      } else {
        setCamera('unavailable')
        setError((e) => ({ ...e, camera: 'Could not start the camera.' }))
      }
      setRequested(true)
      return null
    }
  }, [camera])

  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    setError((e) => ({ ...e, microphone: null }))
    if (microphone === 'denied') return false
    if (!navigator.mediaDevices?.getUserMedia) return false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamsRef.current.push(stream)
      setMicrophone('granted')
      return true
    } catch {
      setMicrophone('denied')
      setError((e) => ({ ...e, microphone: 'Microphone access was denied.' }))
      return false
    }
  }, [microphone])

  const requestGeolocation = useCallback(
    () =>
      new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          setGeolocation('unavailable')
          setError((e) => ({ ...e, geolocation: 'Location is not supported on this device.' }))
          resolve(null)
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGeolocation('granted')
            setError((e) => ({ ...e, geolocation: null }))
            resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          },
          (err) => {
            setGeolocation(
              err.code === GeolocationPositionError.PERMISSION_DENIED ? 'denied' : 'unavailable',
            )
            setError((e) => ({ ...e, geolocation: geolocationErrorToMessage(err) }))
            resolve(null)
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
        )
      }),
    [],
  )

  // Stop all tracks when the caller unmounts so the camera LED turns off.
  useEffect(() => stopTracks, [stopTracks])

  const release = useCallback(() => {
    stopTracks()
    setCamera('unknown')
    setMicrophone('unknown')
    setGeolocation('unknown')
  }, [stopTracks])

  return {
    camera,
    microphone,
    geolocation,
    requested,
    error,
    requestCamera,
    requestMicrophone,
    requestGeolocation,
    release,
  }
}

/** Whether the first-run camera explainer has been shown before. */
export function hasSeenCameraExplainer(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
