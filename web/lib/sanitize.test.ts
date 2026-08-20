import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitize'

describe('sanitizeHtml', () => {
  it('passes through safe HTML', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    expect(sanitizeHtml(html)).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('strips script tags', () => {
    const html = '<p>Hello</p><script>alert("xss")</script>'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>Hello</p>')
  })

  it('strips iframe tags', () => {
    const html = '<iframe src="evil.com"></iframe>'
    expect(sanitizeHtml(html)).not.toContain('<iframe')
  })

  it('strips object tags', () => {
    const html = '<object data="evil.swf"></object>'
    expect(sanitizeHtml(html)).not.toContain('<object')
  })

  it('strips embed tags', () => {
    const html = '<embed src="evil.swf">'
    expect(sanitizeHtml(html)).not.toContain('<embed')
  })

  it('strips form tags', () => {
    const html = '<form action="/steal"><input type="text"></form>'
    expect(sanitizeHtml(html)).not.toContain('<form')
  })

  it('strips input tags', () => {
    const html = '<input type="text">'
    expect(sanitizeHtml(html)).not.toContain('<input')
  })

  it('strips onclick attributes', () => {
    const html = '<div onclick="alert(1)">Click</div>'
    expect(sanitizeHtml(html)).not.toContain('onclick')
    expect(sanitizeHtml(html)).toContain('Click')
  })

  it('strips onerror attributes', () => {
    const html = '<img src="x" onerror="alert(1)">'
    expect(sanitizeHtml(html)).not.toContain('onerror')
  })

  it('strips onload attributes', () => {
    const html = '<img src="x" onload="alert(1)">'
    expect(sanitizeHtml(html)).not.toContain('onload')
  })

  it('strips onmouseover attributes', () => {
    const html = '<div onmouseover="alert(1)">hover</div>'
    expect(sanitizeHtml(html)).not.toContain('onmouseover')
  })

  it('strips style attributes', () => {
    const html = '<div style="background:url(evil)">styled</div>'
    expect(sanitizeHtml(html)).not.toContain('style=')
  })

  it('preserves safe attributes', () => {
    const html = '<a href="https://example.com" class="link">Click</a>'
    const result = sanitizeHtml(html)
    expect(result).toContain('href=')
    expect(result).toContain('class=')
  })

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('handles plain text', () => {
    expect(sanitizeHtml('Hello world')).toBe('Hello world')
  })
})
