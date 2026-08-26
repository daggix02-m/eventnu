import { afterEach, describe, expect, it, vi } from 'vitest'
import { compressImage } from './compress-image'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubImagePipeline(bitmapW = 4000, bitmapH = 3000) {
  const drawImage = vi.fn()
  const close = vi.fn()
  const convertToBlob = vi.fn().mockResolvedValue(new Blob(['blob'], { type: 'image/webp' }))
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

  it('downscales oversized images and re-encodes as webp by default', async () => {
    const { convertToBlob, canvasDims, close } = stubImagePipeline(4000, 3000)
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const out = await compressImage(file)

    expect(canvasDims).toEqual([[1920, 1440]])
    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/webp', quality: 0.8 })
    expect(close).toHaveBeenCalled()
    expect(out.name).toBe('photo.webp')
    expect(out.type).toBe('image/webp')
  })

  it('keeps images within the max dimension at original size', async () => {
    const { canvasDims } = stubImagePipeline(100, 80)
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const out = await compressImage(file)

    expect(canvasDims).toEqual([[100, 80]])
    expect(out.name).toBe('photo.webp')
  })

  it('honours a custom max dimension and format', async () => {
    const { canvasDims, convertToBlob } = stubImagePipeline(4000, 3000)
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const out = await compressImage(file, { maxDimension: 1000, format: 'jpeg', quality: 0.85 })

    expect(canvasDims).toEqual([[1000, 750]])
    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.85 })
    expect(out.name).toBe('photo.jpg')
    expect(out.type).toBe('image/jpeg')
  })

  it('falls back to jpeg when webp encoding is unavailable', async () => {
    const convertToBlob = vi
      .fn()
      .mockRejectedValueOnce(new Error('not supported'))
      .mockResolvedValueOnce(new Blob(['blob'], { type: 'image/jpeg' }))
    class FakeCanvas {
      getContext() {
        return { drawImage: vi.fn() }
      }
      convertToBlob = convertToBlob
    }
    vi.stubGlobal('OffscreenCanvas', FakeCanvas)
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 100, height: 100, close: vi.fn() }),
    )
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const out = await compressImage(file)

    expect(out.type).toBe('image/jpeg')
    expect(out.name).toBe('photo.jpg')
    expect(convertToBlob).toHaveBeenCalledTimes(2)
  })

  it('returns the original file when no 2d context is available', async () => {
    class FakeCanvas {
      getContext() {
        return null
      }
    }
    vi.stubGlobal('OffscreenCanvas', FakeCanvas)
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 100, height: 100, close: vi.fn() }),
    )
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await expect(compressImage(file)).resolves.toBe(file)
  })
})
