import { describe, expect, it } from 'vitest'
import { sanitizeHref } from './helpers'

describe('sanitizeHref', () => {
  it('allows https URLs', () => {
    expect(sanitizeHref('https://example.com')).toBe('https://example.com')
  })

  it('allows http URLs', () => {
    expect(sanitizeHref('http://example.com/page')).toBe('http://example.com/page')
  })

  it('allows relative paths starting with /', () => {
    expect(sanitizeHref('/events/my-event')).toBe('/events/my-event')
  })

  it('blocks javascript: protocol', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBe('#')
  })

  it('blocks data: protocol', () => {
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBe('#')
  })

  it('blocks ftp: protocol', () => {
    expect(sanitizeHref('ftp://evil.com/file')).toBe('#')
  })

  it('returns # for completely invalid URLs', () => {
    expect(sanitizeHref('not a url at all')).toBe('#')
  })

  it('returns # for empty string', () => {
    expect(sanitizeHref('')).toBe('#')
  })

  it('allows URLs with ports', () => {
    expect(sanitizeHref('https://example.com:8080/path')).toBe('https://example.com:8080/path')
  })

  it('allows URLs with query strings', () => {
    expect(sanitizeHref('https://example.com/page?q=1&r=2')).toBe(
      'https://example.com/page?q=1&r=2',
    )
  })
})
