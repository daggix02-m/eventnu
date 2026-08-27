'use client'

import dynamic from 'next/dynamic'

// The camera overlay pulls in getUserMedia, MediaRecorder and the publish
// flow; load it only when actually opened so it never ships in the initial
// bundle. Shared by the bottom-tab camera button and the profile stories hub.
const StoryCameraView = dynamic(
  () => import('@/components/stories/camera/StoryCameraView').then((m) => m.StoryCameraView),
  { ssr: false },
)

interface StoryCameraOverlayProps {
  open: boolean
  onClose: () => void
  onPublished?: () => void
}

export function StoryCameraOverlay({ open, onClose, onPublished }: StoryCameraOverlayProps) {
  if (!open) return null
  return <StoryCameraView onClose={onClose} onPublished={onPublished} />
}
