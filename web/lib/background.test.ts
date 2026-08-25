import { describe, it, expect, afterEach } from 'vitest'
import { isLowEndDevice, readThemePrimary } from './background'

describe('isLowEndDevice', () => {
  it('is false when the browser reports no memory info (desktop fallback)', () => {
    expect(isLowEndDevice({ deviceMemory: undefined, hardwareConcurrency: 8 })).toBe(false)
  })

  it('is true for very low memory devices (2 GB or less)', () => {
    expect(isLowEndDevice({ deviceMemory: 2, hardwareConcurrency: 8 })).toBe(true)
  })

  it('is true for low memory combined with few cores (e.g. budget Android)', () => {
    expect(isLowEndDevice({ deviceMemory: 4, hardwareConcurrency: 4 })).toBe(true)
  })

  it('is false for typical modern phones (4 GB, 6+ cores)', () => {
    expect(isLowEndDevice({ deviceMemory: 4, hardwareConcurrency: 6 })).toBe(false)
  })

  it('is false for modern desktops and high-end phones', () => {
    expect(isLowEndDevice({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe(false)
  })

  it('is false when deviceMemory is reported as 0 (meaningless / unavailable)', () => {
    expect(isLowEndDevice({ deviceMemory: 0, hardwareConcurrency: 2 })).toBe(false)
  })
})

describe('readThemePrimary', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--color-primary')
  })

  it('falls back to the provided color when the CSS variable is not set', () => {
    expect(readThemePrimary('#B497CF')).toBe('#B497CF')
  })

  it('returns the hex theme primary when defined', () => {
    document.documentElement.style.setProperty('--color-primary', '#d0bcff')
    expect(readThemePrimary('#B497CF')).toBe('#d0bcff')
  })

  it('wraps a bare rgb triplet from the theme variable in rgb()', () => {
    document.documentElement.style.setProperty('--color-primary', '208, 188, 255')
    expect(readThemePrimary('#B497CF')).toBe('rgb(208, 188, 255)')
  })
})
