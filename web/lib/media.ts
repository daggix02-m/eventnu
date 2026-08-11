import type { EventImage } from '@/types'

export const FILTER_STYLES: Record<string, string> = {
  vivid: 'saturate(1.3) contrast(1.08)',
  warm: 'sepia(0.18) saturate(1.35) hue-rotate(-10deg) brightness(1.05)',
  cool: 'saturate(1.15) hue-rotate(10deg) brightness(1.02)',
  mono: 'grayscale(1) contrast(1.1)',
}

export function filterStyle(filter?: string | null): string {
  return (filter && FILTER_STYLES[filter]) || 'none'
}

export const ASPECT_CLASSES: Record<string, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
}

export function aspectClass(ratio?: string | null, fallback = 'aspect-[4/5]'): string {
  return ASPECT_CLASSES[ratio ?? ''] ?? fallback
}

export function sortedImages(images?: EventImage[] | null): EventImage[] {
  if (!images || images.length === 0) return []
  return [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export function hasGallery(images?: EventImage[] | null): boolean {
  return !!images && images.length > 1
}
