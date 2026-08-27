'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { compressImage } from '@eventnu/image'
import {
  X,
  Image as ImageIcon,
  Camera,
  Clapperboard,
  SwitchCamera,
  Zap,
  MapPin,
  Send,
  Loader2,
} from 'lucide-react'
import { useStoryPermissions, hasSeenCameraExplainer } from '@/lib/hooks/useStoryPermissions'
import { getTodayString } from '@/lib/dates'
import { Button } from '@/components/ui/button'

type Phase = 'perm' | 'camera' | 'review'
type CaptureMode = 'photo' | 'video'

type MediaTrackCapabilitiesWithTorch = MediaTrackCapabilities & { torch?: boolean }
type MediaTrackConstraintSetWithTorch = MediaTrackConstraintSet & { torch?: boolean }

interface StoryCameraViewProps {
  onClose: () => void
  onPublished?: () => void
}

function makeVideoThumbnailFile(blobUrl: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = blobUrl
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.05, (video.duration ?? 0.05) / 2)
    }
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas unavailable'))
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Thumbnail encoding failed'))
              return
            }
            resolve(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.8,
        )
      } catch (err) {
        reject(err)
      }
    }
    video.onerror = () => reject(new Error('Could not decode video for thumbnail'))
  })
}

export function StoryCameraView({ onClose, onPublished }: StoryCameraViewProps) {
  const permissions = useStoryPermissions()
  const publish = useMutation(api.stories.publish)
  const getUploadUrl = useMutation(api.events.write.generateUploadUrl)
  const events = useQuery(api.events.read.getPublished)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const activeStreamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>('perm')
  const [mode, setMode] = useState<CaptureMode>('photo')
  const [recording, setRecording] = useState(false)
  const [facingUser, setFacingUser] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  // Review / publish state
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [eventId, setEventId] = useState('')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopActiveStream = useCallback(() => {
    activeStreamRef.current?.getTracks().forEach((t) => t.stop())
    activeStreamRef.current = null
  }, [])

  // Single owner of the live camera stream. Attaching stops any previous
  // stream so the camera LED is never on twice and turns off on teardown.
  const attachStream = useCallback(
    (stream: MediaStream) => {
      stopActiveStream()
      activeStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        void videoRef.current.play().catch(() => {
          /* play is best-effort */
        })
      }
      // Detect torch support for the flash toggle.
      try {
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities?.() as
          MediaTrackCapabilitiesWithTorch | undefined
        setTorchSupported(Boolean(capabilities?.torch))
      } catch {
        setTorchSupported(false)
      }
    },
    [stopActiveStream],
  )

  const startStream = useCallback(
    async (video = true, audio = true) => {
      if (!navigator.mediaDevices?.getUserMedia) return null
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { facingMode: facingUser ? 'user' : 'environment' } : false,
          audio,
        })
        attachStream(stream)
        return stream
      } catch {
        return null
      }
    },
    [facingUser, attachStream],
  )

  // Start the camera once the explainer has been cleared (or was seen before).
  // Only advance to the camera phase on success so a failed auto-request falls
  // back to the explainer, where "Continue" provides the required user gesture.
  useEffect(() => {
    if (phase !== 'perm') return
    if (!hasSeenCameraExplainer()) return
    let cancelled = false
    void permissions.requestCamera().then((stream) => {
      // The permission probe stream is discarded; the camera phase acquires
      // the real stream so only one camera track is ever active.
      stream?.getTracks().forEach((t) => t.stop())
      if (!cancelled && stream) setPhase('camera')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Acquire/re-acquire the live stream when entering the camera phase or
  // flipping the camera.
  useEffect(() => {
    if (phase !== 'camera') return
    void startStream(true, true)
  }, [phase, facingUser, startStream])

  // Stop the camera whenever the camera phase is left (review / close).
  useEffect(() => {
    if (phase === 'camera') return
    stopActiveStream()
  }, [phase, stopActiveStream])

  // Apply/clear torch on the active video track.
  useEffect(() => {
    const track =
      videoRef.current?.srcObject instanceof MediaStream
        ? (videoRef.current.srcObject as MediaStream).getVideoTracks()[0]
        : undefined
    try {
      track
        ?.applyConstraints({ advanced: [{ torch: flashOn }] as MediaTrackConstraintSetWithTorch[] })
        .catch(() => {
          /* torch unsupported at runtime */
        })
    } catch {
      /* ignore */
    }
  }, [flashOn])

  const requestExplainerContinue = async () => {
    const stream = await permissions.requestCamera()
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      try {
        localStorage.setItem('eventnu_camera_permission_seen', '1')
      } catch {
        /* storage unavailable */
      }
      setPhase('camera')
    }
  }

  const toggleFlash = () => setFlashOn((f) => !f)

  const switchCamera = () => {
    setFacingUser((f) => !f)
    setFlashOn(false)
  }

  const openGallery = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) handleMediaSelected(file)
    }
    input.click()
  }

  const handleMediaSelected = async (file: File) => {
    const isVideo = file.type.startsWith('video/')
    setError(null)
    setMode(isVideo ? 'video' : 'photo')
    setMediaFile(file)
    setMediaPreviewUrl(URL.createObjectURL(file))
    if (isVideo) {
      try {
        const thumb = await makeVideoThumbnailFile(URL.createObjectURL(file))
        setThumbnailFile(thumb)
      } catch {
        setThumbnailFile(null)
      }
    } else {
      setThumbnailFile(null)
    }
    setPhase('review')
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (facingUser) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        const file = new File([blob], 'story.jpg', { type: 'image/jpeg' })
        setError(null)
        setMode('photo')
        setMediaFile(file)
        setMediaPreviewUrl(URL.createObjectURL(file))
        setThumbnailFile(null)
        setPhase('review')
      },
      'image/jpeg',
      0.9,
    )
  }

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream | undefined
    if (!stream) return
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : ''
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/mp4' })
      const file = new File([blob], 'story.mp4', { type: blob.type || 'video/mp4' })
      try {
        const thumb = await makeVideoThumbnailFile(URL.createObjectURL(blob))
        setThumbnailFile(thumb)
      } catch {
        setThumbnailFile(null)
      }
      setError(null)
      setMode('video')
      setMediaFile(file)
      setMediaPreviewUrl(URL.createObjectURL(file))
      setPhase('review')
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const handleGeolocate = async () => {
    const coords = await permissions.requestGeolocation()
    if (coords) {
      setLocation(coords)
      setError(null)
    } else {
      setLocation(null)
    }
  }

  const publishStory = async () => {
    if (!mediaFile) return
    setSubmitting(true)
    setError(null)
    try {
      // Photos are compressed before upload; videos pass through untouched.
      const fileToUpload = mode === 'photo' ? await compressImage(mediaFile) : mediaFile

      const uploadUrl = await getUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': fileToUpload.type },
        body: fileToUpload,
      })
      if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
      const { storageId } = await res.json()
      if (!storageId) throw new Error('Upload failed')

      let thumbnailStorageId: string | undefined
      if (thumbnailFile) {
        const thumb = await compressImage(thumbnailFile, { maxDimension: 480, quality: 0.75 })
        const thumbUrl = await getUploadUrl()
        const thumbRes = await fetch(thumbUrl, {
          method: 'POST',
          headers: { 'Content-Type': thumb.type },
          body: thumb,
        })
        if (thumbRes.ok) {
          const { storageId: thumbId } = await thumbRes.json()
          if (thumbId) thumbnailStorageId = thumbId as string
        }
      }

      await publish({
        kind: mode,
        mediaStorageId: storageId as string,
        caption: caption.trim() || undefined,
        eventId: eventId ? (eventId as Id<'events'>) : undefined,
        dateKey: getTodayString(),
        thumbnailStorageId,
        latitude: location?.latitude,
        longitude: location?.longitude,
      })
      onPublished?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish your story')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    stopActiveStream()
    permissions.release()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create a story"
      className="fixed inset-0 z-90 flex flex-col bg-black"
    >
      {/* ── Permission explainer ─────────────────────────────────────────── */}
      {phase === 'perm' && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <Camera className="h-9 w-9 text-white" aria-hidden="true" />
          </span>
          <h2 className="mt-lg font-display text-headline-md text-white">Capture the moment</h2>
          <p className="mt-sm max-w-[24rem] font-body-md text-white/70">
            Event Nu uses your camera for photos and your microphone for video stories. Location is
            optional — it tags where your story happened.
          </p>
          <Button size="lg" onClick={() => void requestExplainerContinue()} className="mt-lg">
            Continue
          </Button>
          <button
            type="button"
            onClick={close}
            className="mt-sm text-body-sm font-medium text-white/60 hover:text-white"
          >
            Not now
          </button>
          {permissions.error.camera && (
            <p role="alert" className="mt-md max-w-[24rem] font-body-sm text-red-300">
              {permissions.error.camera}
            </p>
          )}
        </div>
      )}

      {/* ── Live camera ──────────────────────────────────────────────────── */}
      {phase === 'camera' && (
        <>
          <div className="relative z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={close}
              aria-label="Close camera"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleFlash}
              disabled={!torchSupported}
              aria-label={flashOn ? 'Turn flash off' : 'Turn flash on'}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <Zap
                className={flashOn ? 'h-6 w-6 fill-yellow-300 text-yellow-300' : 'h-6 w-6'}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {!permissions.requested && permissions.error.camera && (
              <p
                role="alert"
                className="absolute inset-x-4 bottom-24 text-center font-body-sm text-red-300"
              >
                {permissions.error.camera}
              </p>
            )}
          </div>

          {/* Bottom controls — gallery button sits bottom-left */}
          <div className="relative z-20 flex items-center justify-between px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={openGallery}
              aria-label="Choose from photo gallery"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-transform active:scale-90"
            >
              <ImageIcon className="h-7 w-7" aria-hidden="true" />
            </button>

            {mode === 'photo' ? (
              <button
                type="button"
                onClick={capturePhoto}
                aria-label="Take photo"
                className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90"
              >
                <span className="h-13 w-13 rounded-full bg-white" />
              </button>
            ) : recording ? (
              <button
                type="button"
                onClick={stopRecording}
                aria-label="Stop recording"
                className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90"
              >
                <span className="h-5 w-5 rounded-md bg-red-500" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                aria-label="Start recording video"
                className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90"
              >
                <span className="h-13 w-13 rounded-full bg-red-500" />
              </button>
            )}

            <button
              type="button"
              onClick={switchCamera}
              aria-label="Switch camera"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-transform active:scale-90"
            >
              <SwitchCamera className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>

          {/* Mode toggle above the shutter */}
          <div className="relative z-20 -mt-12 flex justify-center pb-2">
            <div
              className="flex rounded-full bg-white/10 p-1"
              role="tablist"
              aria-label="Capture mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'photo'}
                onClick={() => setMode('photo')}
                className="flex items-center gap-1 rounded-full px-4 py-1.5 text-label-sm text-white transition-colors data-[selected=true]:bg-white/20"
                data-selected={mode === 'photo'}
              >
                <Camera className="h-4 w-4" aria-hidden="true" /> Photo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'video'}
                onClick={() => setMode('video')}
                className="flex items-center gap-1 rounded-full px-4 py-1.5 text-label-sm text-white transition-colors data-[selected=true]:bg-white/20"
                data-selected={mode === 'video'}
              >
                <Clapperboard className="h-4 w-4" aria-hidden="true" /> Video
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Review & publish ─────────────────────────────────────────────── */}
      {phase === 'review' && mediaPreviewUrl && (
        <div className="flex flex-1 flex-col">
          <div className="relative z-20 flex items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setPhase('camera')}
              aria-label="Retake"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="mx-auto text-body-sm font-medium text-white">Preview</p>
            <span className="w-11" />
          </div>

          <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {mode === 'photo' ? (
              <Image
                src={mediaPreviewUrl}
                alt="Story preview"
                fill
                sizes="100vw"
                className="object-contain"
              />
            ) : (
              <video
                src={mediaPreviewUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
              />
            )}
          </div>

          <div className="relative z-20 space-y-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Add a caption…"
              aria-label="Story caption"
              className="w-full resize-y rounded-xl border border-white/20 bg-white/10 px-md py-3 font-body-md text-white placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              aria-label="Associated event"
              className="w-full rounded-xl border border-white/20 bg-black/40 px-md py-3 font-body-md text-white focus:border-primary focus:outline-none"
            >
              <option value="">No specific event</option>
              {(events ?? []).map(
                (event: FunctionReturnType<typeof api.events.read.getPublished>[number]) => (
                  <option key={event._id as string} value={event._id as string}>
                    {event.title}
                  </option>
                ),
              )}
            </select>
            <button
              type="button"
              onClick={() => void handleGeolocate()}
              className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-md py-3 text-body-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {location
                ? `Tagged at ${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
                : 'Add location'}
            </button>

            {error && (
              <p role="alert" className="font-body-sm text-red-300">
                {error}
              </p>
            )}

            <Button onClick={() => void publishStory()} disabled={submitting} className="w-full">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting ? 'Publishing…' : 'Publish story'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
