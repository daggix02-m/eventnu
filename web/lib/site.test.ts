import { describe, it, expect, afterEach } from 'vitest'
import { getSiteUrl, absoluteUrl, SITE } from './site'

describe('SITE', () => {
  it('has required fields', () => {
    expect(SITE.name).toBe('Event Nu')
    expect(SITE.domain).toBe('eventnu.et')
    expect(SITE.timezone).toBe('Africa/Addis_Ababa')
  })

  it('has social links', () => {
    expect(SITE.social.instagram.url).toContain('instagram.com')
    expect(SITE.social.telegram.url).toContain('t.me')
  })

  it('has phone entries', () => {
    expect(SITE.phones.length).toBeGreaterThan(0)
    expect(SITE.phones[0].tel).toMatch(/^\+/)
  })
})

describe('getSiteUrl', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns NEXT_PUBLIC_SITE_URL when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    expect(getSiteUrl()).toBe('https://example.com')
  })

  it('strips trailing slashes from env URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com///'
    expect(getSiteUrl()).toBe('https://example.com')
  })

  it('falls back to SITE.domain when env is not set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe(`https://${SITE.domain}`)
  })
})

describe('absoluteUrl', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('prepends site URL to a path', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(absoluteUrl('/events/test')).toBe(`https://${SITE.domain}/events/test`)
  })

  it('adds leading slash if path does not have one', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(absoluteUrl('events/test')).toBe(`https://${SITE.domain}/events/test`)
  })

  it('uses custom site URL when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.com'
    expect(absoluteUrl('/about')).toBe('https://custom.com/about')
  })
})
