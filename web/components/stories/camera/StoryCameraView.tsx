'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
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
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useStoryPermissions, hasSeenCameraExplainer } from '@/lib/hooks/useStoryPermissions'
import { getTodayString } from '@/lib/dates'
import { filterStyle, type FilterId } from '@/lib/media'
import { Button } from '@/components/ui/button'
import { FilterStrip } from './FilterStrip'
import { EventSearchSelect } from './EventSearchSelect'
import { TextOverlayEditor, type TextOverlayData } from './TextOverlay'
import { StickerOverlayEditor, type StickerData } from './StickerOverlay'

type Phase = 'perm' | 'camera' | 'edit' | 'details'
type CaptureMode = 'photo' | 'video'

/** Map server error messages to user-friendly strings. */
function describeStoryError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Not authenticated')) return 'Please sign in to share a story.'
    if (msg.includes('Account suspended'))
      return 'Your account has been suspended. Please contact support.'
    if (msg.includes('Caption must be'))
      return 'Caption is too long. Please keep it under 500 characters.'
    if (msg.includes('Event not found')) return 'The tagged event could not be found.'
    if (msg.includes('Uploaded file not found') || msg.includes('Thumbnail file not found'))
      return 'Media upload failed. Please try again.'
    if (msg.includes('must be an image') || msg.includes('must be a video'))
      return 'Invalid file type. Please select the correct media format.'
    if (msg.includes('rate limit') || msg.includes('Too many'))
      return 'Too many stories posted. Please try again later.'
    if (
      msg.includes('Could not connect') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed')
    )
      return 'Could not reach the server. Check your connection and try again.'
  }
  return 'Failed to publish your story. Please try again.'
}

type MediaTrackCapabilitiesWithTorch = MediaTrackCapabilities & { torch?: boolean }
type MediaTrackConstraintSetWithTorch = MediaTrackConstraintSet & { torch?: boolean }

interface TransformState {
  rotate: 0 | 90 | 180 | 270
  flipH: boolean
  flipV: boolean
}

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

/** Build a CSS transform string from TransformState */
function transformCSS(t: TransformState): string {
  const parts: string[] = []
  if (t.rotate) parts.push(`rotate(${t.rotate}deg)`)
  if (t.flipH) parts.push('scaleX(-1)')
  if (t.flipV) parts.push('scaleY(-1)')
  return parts.length > 0 ? parts.join(' ') : 'none'
}

export function StoryCameraView({ onClose, onPublished }: StoryCameraViewProps) {
  const permissions = useStoryPermissions()
  const publish = useMutation(api.stories.publish)
  const getUploadUrl = useMutation(api.events.write.generateUploadUrl)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const previewImageRef = useRef<HTMLImageElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const activeStreamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>('perm')
  const [mode, setMode] = useState<CaptureMode>('photo')
  const [recording, setRecording] = useState(false)
  const [facingUser, setFacingUser] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  // Editor state
  const [activeFilter, setActiveFilter] = useState<FilterId>(null)
  const [transforms, setTransforms] = useState<TransformState>({
    rotate: 0,
    flipH: false,
    flipV: false,
  })
  const [textOverlays, setTextOverlays] = useState<TextOverlayData[]>([])
  const [stickers, setStickers] = useState<StickerData[]>([])

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
  useEffect(() => {
    if (phase !== 'perm') return
    if (!hasSeenCameraExplainer()) return
    let cancelled = false
    void permissions.requestCamera().then((stream) => {
      stream?.getTracks().forEach((t) => t.stop())
      if (!cancelled && stream) setPhase('camera')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Acquire/re-acquire the live stream when entering the camera phase or flipping.
  useEffect(() => {
    if (phase !== 'camera') return
    void startStream(true, true)
  }, [phase, facingUser, startStream])

  // Stop the camera whenever the camera phase is left.
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
        .catch(() => {})
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
    // Reset editor state for new media
    setActiveFilter(null)
    setTransforms({ rotate: 0, flipH: false, flipV: false })
    setTextOverlays([])
    setStickers([])
    setPhase('edit')
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
        // Reset editor state
        setActiveFilter(null)
        setTransforms({ rotate: 0, flipH: false, flipV: false })
        setTextOverlays([])
        setStickers([])
        setPhase('edit')
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
      // Reset editor state
      setActiveFilter(null)
      setTransforms({ rotate: 0, flipH: false, flipV: false })
      setTextOverlays([])
      setStickers([])
      setPhase('edit')
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

  const rotateTransform = () => {
    setTransforms((t) => ({
      ...t,
      rotate: ((t.rotate + 90) % 360) as 0 | 90 | 180 | 270,
    }))
  }

  const flipHTransform = () => {
    setTransforms((t) => ({ ...t, flipH: !t.flipH }))
  }

  const flipVTransform = () => {
    setTransforms((t) => ({ ...t, flipV: !t.flipV }))
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

      // Build editor metadata
      const hasTransforms = transforms.rotate !== 0 || transforms.flipH || transforms.flipV

      await publish({
        kind: mode,
        mediaStorageId: storageId as string,
        caption: caption.trim() || undefined,
        eventId: eventId ? (eventId as Id<'events'>) : undefined,
        dateKey: getTodayString(),
        thumbnailStorageId,
        latitude: location?.latitude,
        longitude: location?.longitude,
        filter: activeFilter ?? undefined,
        transforms: hasTransforms ? transforms : undefined,
        textOverlays: textOverlays.length > 0 ? textOverlays : undefined,
        stickers: stickers.length > 0 ? stickers : undefined,
      })
      onPublished?.()
      onClose()
    } catch (err) {
      setError(describeStoryError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    stopActiveStream()
    permissions.release()
    onClose()
  }

  // Computed transform CSS for preview
  const previewTransform = transformCSS(transforms)
  const previewFilter = filterStyle(activeFilter)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create a story"
      className="fixed inset-0 z-90 flex flex-col bg-black pointer-events-auto"
    >
      {/* ── Permission explainer ─────────────────────────────────────────── */}
      {phase === 'perm' && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 animate-pulse">
            <Camera className="h-9 w-9 text-white" aria-hidden="true" />
          </span>
          <h2 className="mt-lg font-display text-headline-md text-white">Capture the moment</h2>

          {/* Permission chips */}
          <div className="mt-md flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-body-sm text-white/70">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Camera
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-body-sm text-white/70">
              <Clapperboard className="h-4 w-4" aria-hidden="true" />
              Microphone
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-body-sm text-white/70">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Location (optional)
            </div>
          </div>

          <Button size="lg" onClick={() => void requestExplainerContinue()} className="mt-lg">
            Continue
          </Button>
          <button
            type="button"
            onClick={close}
            className="mt-sm min-h-[44px] px-4 text-body-sm font-medium text-white/60 transition-colors hover:text-white active:text-white/80"
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
          {/* Top bar: close, flash, camera flip */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={close}
              aria-label="Close camera"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-1">
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
              <button
                type="button"
                onClick={switchCamera}
                aria-label="Switch camera"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              >
                <SwitchCamera className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Viewfinder with live filter preview */}
          <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              style={{ filter: previewFilter }}
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

          {/* Filter strip */}
          <div className="relative z-20 -mb-1">
            <FilterStrip value={activeFilter} onChange={setActiveFilter} previewRef={videoRef} />
          </div>

          {/* Bottom controls */}
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
            <span className="h-14 w-14" /> {/* Spacer for alignment */}
          </div>

          {/* Mode toggle */}
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

      {/* ── Edit phase: filter + transform controls ─────────────────────── */}
      {phase === 'edit' && mediaPreviewUrl && (
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <div className="relative z-20 flex items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setPhase('camera')}
              aria-label="Retake"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="mx-auto text-body-sm font-medium text-white">Edit</p>
            <button
              type="button"
              onClick={() => setPhase('details')}
              aria-label="Next: Add details"
              className="flex h-11 items-center gap-1 rounded-full px-3 text-body-sm font-medium text-primary transition-colors hover:bg-white/10"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Media preview with filter + transform applied */}
          <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {mode === 'photo' ? (
              <Image
                ref={previewImageRef}
                src={mediaPreviewUrl}
                alt="Story preview"
                fill
                sizes="100vw"
                className="object-contain"
                style={{ filter: previewFilter, transform: previewTransform }}
              />
            ) : (
              <video
                src={mediaPreviewUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
                style={{ filter: previewFilter, transform: previewTransform }}
              />
            )}
            {/* Text overlays */}
            <TextOverlayEditor overlays={textOverlays} onChange={setTextOverlays} />
            {/* Sticker overlays */}
            <StickerOverlayEditor stickers={stickers} onChange={setStickers} />
          </div>

          {/* Transform controls */}
          <div className="relative z-20 flex items-center justify-center gap-4 py-3">
            <button
              type="button"
              onClick={rotateTransform}
              aria-label="Rotate 90 degrees"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <RotateCw className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={flipHTransform}
              aria-label="Flip horizontally"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <FlipHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={flipVTransform}
              aria-label="Flip vertically"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <FlipVertical className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Filter strip */}
          <div className="relative z-20 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <FilterStrip
              value={activeFilter}
              onChange={setActiveFilter}
              previewRef={mode === 'photo' ? previewImageRef : videoRef}
            />
          </div>
        </div>
      )}

      {/* ── Details phase: caption, event, location ──────────────────────── */}
      {phase === 'details' && mediaPreviewUrl && (
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <div className="relative z-20 flex items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setPhase('edit')}
              aria-label="Back to editing"
              className="flex h-11 items-center gap-1 rounded-full px-3 text-body-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" /> Edit
            </button>
            <p className="mx-auto text-body-sm font-medium text-white">Details</p>
            <span className="w-11" />
          </div>

          {/* Small media preview */}
          <div className="relative z-0 mx-4 mt-3 h-40 overflow-hidden rounded-xl">
            {mode === 'photo' ? (
              <Image
                src={mediaPreviewUrl}
                alt="Story preview"
                fill
                sizes="300px"
                className="object-cover"
                style={{ filter: previewFilter, transform: previewTransform }}
              />
            ) : (
              <video
                src={mediaPreviewUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
                style={{ filter: previewFilter, transform: previewTransform }}
              />
            )}
            {/* Filter badge */}
            {activeFilter && (
              <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                {activeFilter}
              </span>
            )}
          </div>

          {/* Details form */}
          <div className="relative z-20 flex-1 space-y-3 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {/* Caption */}
            <div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Add a caption..."
                aria-label="Story caption"
                className="w-full resize-y rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-body-md text-white placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p
                className={`mt-1 text-right text-[11px] ${
                  caption.length > 450
                    ? 'text-red-400'
                    : caption.length > 350
                      ? 'text-amber-400'
                      : 'text-white/40'
                }`}
              >
                {caption.length}/500
              </p>
            </div>

            {/* Event search */}
            <EventSearchSelect
              value={eventId}
              onChange={setEventId}
              placeholder="Tag an event..."
            />

            {/* Location */}
            <button
              type="button"
              onClick={() => void handleGeolocate()}
              className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-body-sm font-medium text-white transition-colors hover:bg-white/20"
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
              {submitting ? 'Publishing...' : 'Publish story'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
