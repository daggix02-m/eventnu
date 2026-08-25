import { describe, it, expect } from 'vitest'
import { shouldAnimateMarquee } from './marquee'

describe('shouldAnimateMarquee', () => {
  const animating = { inView: true, tabVisible: true, hovered: false }

  it('animates when the strip is on screen, the tab is visible, and nothing hovers it', () => {
    expect(shouldAnimateMarquee(animating)).toBe(true)
  })

  it('pauses when the strip has scrolled out of view', () => {
    expect(shouldAnimateMarquee({ ...animating, inView: false })).toBe(false)
  })

  it('pauses when the tab is hidden (background tab / screen off)', () => {
    expect(shouldAnimateMarquee({ ...animating, tabVisible: false })).toBe(false)
  })

  it('pauses while the pointer hovers the strip (desktop)', () => {
    expect(shouldAnimateMarquee({ ...animating, hovered: true })).toBe(false)
  })

  it('resumes as soon as every pause condition clears', () => {
    expect(shouldAnimateMarquee({ inView: false, tabVisible: false, hovered: true })).toBe(false)
    expect(shouldAnimateMarquee({ ...animating })).toBe(true)
  })
})
