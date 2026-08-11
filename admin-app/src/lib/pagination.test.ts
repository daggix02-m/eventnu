import { describe, expect, it } from 'vitest'
import { DEFAULT_PAGE_SIZE, paginate } from './pagination'

const items = Array.from({ length: 45 }, (_, i) => i + 1)

describe('paginate', () => {
  it('returns the first page with the default page size', () => {
    expect(paginate(items)).toEqual(Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => i + 1))
  })

  it('returns the requested page', () => {
    expect(paginate(items, 2)).toEqual(
      Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => i + 1 + DEFAULT_PAGE_SIZE),
    )
  })

  it('returns a partial final page', () => {
    expect(paginate(items, 3)).toEqual([41, 42, 43, 44, 45])
  })

  it('returns an empty array when the page is out of range', () => {
    expect(paginate(items, 99)).toEqual([])
  })

  it('honors a custom per-page size', () => {
    expect(paginate(items, 2, 10)).toEqual(Array.from({ length: 10 }, (_, i) => i + 11))
  })

  it('handles an empty array', () => {
    expect(paginate([])).toEqual([])
  })
})
