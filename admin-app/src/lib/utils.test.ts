import { afterEach, describe, expect, it, vi } from 'vitest'
import { cn, compressImage, formatFileSize } from './utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
  })

  it('formats gigabytes with one decimal', () => {
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
  })
})

describe('cn', () => {
  it('joins classes and dedupes conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'bg-red-500')).toBe('text-red-500 bg-red-500')
  })

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })
})

function stubImagePipeline(bitmapW = 4000, bitmapH = 3000) {
  const drawImage = vi.fn()
  const close = vi.fn()
  const convertToBlob = vi.fn().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' }))
  const canvasDims: Array<[number, number]> = []

  class FakeCanvas {
    width: number
    height: number
    constructor(width: number, height: number) {
      this.width = width
      this.height = height
      canvasDims.push([width, height])
    }
    getContext() {
      return { drawImage }
    }
    convertToBlob = convertToBlob
  }

  vi.stubGlobal('OffscreenCanvas', FakeCanvas)
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width: bitmapW, height: bitmapH, close }),
  )
  return { drawImage, convertToBlob, close, canvasDims }
}

describe('compressImage', () => {
  it('returns non-image and gif files untouched', async () => {
    const gif = new File(['g'], 'a.gif', { type: 'image/gif' })
    await expect(compressImage(gif)).resolves.toBe(gif)

    const pdf = new File(['p'], 'a.pdf', { type: 'application/pdf' })
    await expect(compressImage(pdf)).resolves.toBe(pdf)
  })

  it('downscales oversized images and re-encodes as jpeg', async () => {
    const { convertToBlob, canvasDims, close } = stubImagePipeline(4000, 3000)
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const out = await compressImage(file)

    expect(canvasDims).toEqual([[2000, 1500]])
    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.85 })
    expect(close).toHaveBeenCalled()
    expect(out.name).toBe('photo.jpg')
    expect(out.type).toBe('image/jpeg')
  })

  it('keeps images within the max dimension at original size', async () => {
    const { canvasDims } = stubImagePipeline(100, 80)
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const out = await compressImage(file)

    expect(canvasDims).toEqual([[100, 80]])
    expect(out.name).toBe('photo.jpg')
  })
})
