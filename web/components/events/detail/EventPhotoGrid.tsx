'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { filterStyle, sortedImages } from '@/lib/media'
import type { EventImage } from '@/types'

interface EventPhotoGridProps {
  images: EventImage[]
  eventTitle: string
  imageAspectRatio?: string | null
}

function getLightboxDimensions(imageAspectRatio?: string | null) {
  const [widthRatio, heightRatio] = (imageAspectRatio ?? '').split(':').map(Number)
  if (widthRatio > 0 && heightRatio > 0) {
    const width = 1600
    return { width, height: Math.round((width * heightRatio) / widthRatio) }
  }

  return { width: 1600, height: 2000 }
}

export function EventPhotoGrid({ images, eventTitle, imageAspectRatio }: EventPhotoGridProps) {
  const sorted = sortedImages(images)
  const lightboxDimensions = getLightboxDimensions(imageAspectRatio)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpenIndex((i) => {
      if (i !== null) {
        triggerRefs.current[i]?.focus()
      }
      return null
    })
  }, [])

  const go = useCallback(
    (dir: number) => {
      setOpenIndex((i) => (i === null ? null : (i + dir + sorted.length) % sorted.length))
    },
    [sorted.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, close, go])

  useEffect(() => {
    if (openIndex === null) return
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [openIndex])

  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (sorted.length === 0) return null

  const active = openIndex !== null ? sorted[openIndex] : null

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        {sorted.map((img, i) => (
          <button
            key={img.id}
            type="button"
            ref={(el) => {
              triggerRefs.current[i] = el
            }}
            onClick={() => setOpenIndex(i)}
            aria-label={`Open photo ${i + 1} of ${sorted.length} — ${eventTitle}`}
            className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-high group cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Image
              src={img.url}
              alt={`${eventTitle} photo ${i + 1}`}
              fill
              loading="lazy"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ filter: filterStyle(img.filter) }}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        ))}
      </div>

      {active && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${eventTitle} — photo ${openIndex + 1} of ${sorted.length}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onKeyDown={onDialogKeyDown}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative w-full h-full outline-none flex flex-col items-center justify-center"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close photo viewer"
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-5xl px-4 max-h-[80vh]">
              <Image
                key={active.id}
                src={active.url}
                alt={`${eventTitle} photo ${openIndex + 1}`}
                width={lightboxDimensions.width}
                height={lightboxDimensions.height}
                priority
                className="w-auto h-full max-h-[80vh] mx-auto object-contain rounded-lg"
                style={{ filter: filterStyle(active.filter) }}
              />
            </div>

            <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-md px-4">
              {sorted.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous photo"
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <p className="font-mono text-label-sm text-white/90" aria-live="polite">
                    {openIndex + 1} / {sorted.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next photo"
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
