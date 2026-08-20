import { describe, it, expect } from 'vitest'
import { filterStyle, aspectClass, sortedImages, hasGallery } from './media'
import type { EventImage } from '../types'

describe('filterStyle', () => {
  it('returns CSS filter for "vivid"', () => {
    expect(filterStyle('vivid')).toBe('saturate(1.3) contrast(1.08)')
  })

  it('returns CSS filter for "warm"', () => {
    expect(filterStyle('warm')).toBe(
      'sepia(0.18) saturate(1.35) hue-rotate(-10deg) brightness(1.05)',
    )
  })

  it('returns CSS filter for "cool"', () => {
    expect(filterStyle('cool')).toBe('saturate(1.15) hue-rotate(10deg) brightness(1.02)')
  })

  it('returns CSS filter for "mono"', () => {
    expect(filterStyle('mono')).toBe('grayscale(1) contrast(1.1)')
  })

  it('returns "none" for unknown filter', () => {
    expect(filterStyle('unknown')).toBe('none')
  })

  it('returns "none" for undefined', () => {
    expect(filterStyle(undefined)).toBe('none')
  })

  it('returns "none" for null', () => {
    expect(filterStyle(null)).toBe('none')
  })

  it('returns "none" for empty string', () => {
    expect(filterStyle('')).toBe('none')
  })
})

describe('aspectClass', () => {
  it('returns aspect-square for "1:1"', () => {
    expect(aspectClass('1:1')).toBe('aspect-square')
  })

  it('returns aspect-[4/5] for "4:5"', () => {
    expect(aspectClass('4:5')).toBe('aspect-[4/5]')
  })

  it('returns aspect-video for "16:9"', () => {
    expect(aspectClass('16:9')).toBe('aspect-video')
  })

  it('returns fallback for unknown ratio', () => {
    expect(aspectClass('21:9')).toBe('aspect-[4/5]')
  })

  it('returns fallback for undefined', () => {
    expect(aspectClass(undefined)).toBe('aspect-[4/5]')
  })

  it('returns fallback for null', () => {
    expect(aspectClass(null)).toBe('aspect-[4/5]')
  })

  it('accepts custom fallback', () => {
    expect(aspectClass(undefined, 'aspect-[3/4]')).toBe('aspect-[3/4]')
  })

  it('uses default fallback when ratio is unknown', () => {
    expect(aspectClass('custom')).toBe('aspect-[4/5]')
  })
})

describe('sortedImages', () => {
  it('returns empty array for undefined', () => {
    expect(sortedImages(undefined)).toEqual([])
  })

  it('returns empty array for null', () => {
    expect(sortedImages(null)).toEqual([])
  })

  it('returns empty array for empty array', () => {
    expect(sortedImages([])).toEqual([])
  })

  it('sorts images by sort_order ascending', () => {
    const images: EventImage[] = [
      { id: '1', url: 'a.jpg', sort_order: 3 },
      { id: '2', url: 'b.jpg', sort_order: 1 },
      { id: '3', url: 'c.jpg', sort_order: 2 },
    ]
    const result = sortedImages(images)
    expect(result.map((i) => i.id)).toEqual(['2', '3', '1'])
  })

  it('treats undefined sort_order as 0', () => {
    const images: EventImage[] = [
      { id: '1', url: 'a.jpg', sort_order: 5 },
      { id: '2', url: 'b.jpg' },
      { id: '3', url: 'c.jpg', sort_order: 1 },
    ]
    const result = sortedImages(images)
    expect(result.map((i) => i.id)).toEqual(['2', '3', '1'])
  })

  it('does not mutate the original array', () => {
    const images: EventImage[] = [
      { id: '1', url: 'a.jpg', sort_order: 2 },
      { id: '2', url: 'b.jpg', sort_order: 1 },
    ]
    sortedImages(images)
    expect(images[0].id).toBe('1')
  })
})

describe('hasGallery', () => {
  it('returns false for undefined', () => {
    expect(hasGallery(undefined)).toBe(false)
  })

  it('returns false for null', () => {
    expect(hasGallery(null)).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(hasGallery([])).toBe(false)
  })

  it('returns false for single image', () => {
    expect(hasGallery([{ id: '1', url: 'a.jpg' }])).toBe(false)
  })

  it('returns true for two or more images', () => {
    expect(
      hasGallery([
        { id: '1', url: 'a.jpg' },
        { id: '2', url: 'b.jpg' },
      ]),
    ).toBe(true)
  })
})
