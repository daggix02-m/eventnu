import { describe, expect, it } from 'vitest'
import { patchDefined, slugify, uniqueSlug } from './helpers'

describe('patchDefined', () => {
  it('keeps defined fields and drops undefined ones', () => {
    expect(patchDefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' })
  })

  it('keeps falsy-but-defined values', () => {
    expect(patchDefined({ a: null, b: 0, c: '', d: false })).toEqual({
      a: null,
      b: 0,
      c: '',
      d: false,
    })
  })

  it('returns an empty object when every field is undefined', () => {
    expect(patchDefined({ a: undefined, b: undefined })).toEqual({})
  })
})

describe('slugify', () => {
  it('lowercases and replaces separators with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('Sauti Sol — Live in Addis')).toBe('sauti-sol-live-in-addis')
  })

  it('trims leading and trailing separators', () => {
    expect(slugify('  spaces around  ')).toBe('spaces-around')
  })

  it('collapses repeated separators', () => {
    expect(slugify('a  b---c')).toBe('a-b-c')
  })

  it('handles unicode text by stripping non-ascii alphanumerics', () => {
    expect(slugify('አዲስ አበባ')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('appends a short random suffix to the slugified text', () => {
    const result = uniqueSlug('Hello World')
    expect(result).toMatch(/^hello-world-[a-z0-9]{5}$/)
  })

  it('produces distinct values on repeated calls', () => {
    const a = uniqueSlug('My Event')
    const b = uniqueSlug('My Event')
    expect(a).not.toBe(b)
  })
})
