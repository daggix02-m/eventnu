/**
 * Client-side image compression used by every upload flow in the web and
 * admin apps. Images are downscaled to a sane maximum dimension and
 * re-encoded as WebP (falling back to JPEG where WebP encoding is
 * unsupported) before they are uploaded to Convex storage — so the bytes
 * that reach users are already small and never ship as multi-MB originals.
 *
 * Kept dependency-free and browser-API-only so both Next.js apps can share
 * it as a plain TS module.
 */

export interface CompressOptions {
  /** Largest allowed edge in pixels. Larger images are downscaled to fit. */
  maxDimension?: number
  /** Re-encode quality (0–1). */
  quality?: number
  /** Preferred output format; falls back to JPEG automatically. */
  format?: 'webp' | 'jpeg'
}

const DEFAULT_MAX_DIMENSION = 1920
const DEFAULT_QUALITY = 0.8
const DEFAULT_FORMAT: 'webp' | 'jpeg' = 'webp'

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    format = DEFAULT_FORMAT,
  } = options

  // Never attempt to re-encode non-images or animated GIFs.
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const encodings: Array<{ type: string; ext: string }> =
    format === 'jpeg'
      ? [{ type: 'image/jpeg', ext: 'jpg' }]
      : [
          { type: 'image/webp', ext: 'webp' },
          { type: 'image/jpeg', ext: 'jpg' },
        ]

  for (const { type, ext } of encodings) {
    try {
      const blob = await canvas.convertToBlob({ type, quality })
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.${ext}`, { type })
    } catch {
      // WebP encoding is unavailable on some engines; try the next format.
    }
  }

  throw new Error('Image compression failed')
}
