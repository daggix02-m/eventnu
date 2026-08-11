import { describe, expect, it } from 'vitest'
import { fadeUp } from './motion'

describe('fadeUp', () => {
  it('defines the fade-up entrance', () => {
    expect(fadeUp.initial).toEqual({ opacity: 0, y: 20 })
    expect(fadeUp.animate).toEqual({ opacity: 1, y: 0 })
    expect(fadeUp.transition).toEqual({ duration: 0.3 })
  })
})
