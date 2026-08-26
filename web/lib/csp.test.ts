import { describe, it, expect } from 'vitest'
import { buildCsp } from './csp'

describe('buildCsp', () => {
  it('allows self and inline scripts without a nonce in production', () => {
    const csp = buildCsp(false)
    expect(csp).toContain(`script-src 'self' 'unsafe-inline'`)
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).not.toContain('nonce-')
    expect(csp).not.toContain("'strict-dynamic'")
  })

  it('adds unsafe-eval for inline scripts in development only', () => {
    const csp = buildCsp(true)
    expect(csp).toContain(`script-src 'self' 'unsafe-inline' 'unsafe-eval'`)
  })

  it('keeps the static allowlists for other directives', () => {
    const csp = buildCsp(false)
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
    expect(csp).toContain("img-src 'self' data: blob:")
    expect(csp).toContain("connect-src 'self' https://*.convex.cloud")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'self'")
  })
})
