import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { compressImage as compress } from '@eventnu/image'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Client-side compression for uploads (posters, event photos). Delegates to
 * the shared `@eventnu/image` util so both apps enforce the same pipeline:
 * images are downscaled to 1920px and re-encoded as WebP (JPEG fallback)
 * before they reach Convex storage.
 */
export function compressImage(file: File): Promise<File> {
  return compress(file)
}
