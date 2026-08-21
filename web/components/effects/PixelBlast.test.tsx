import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'

// jsdom has no WebGL. Simulate the worst real-device case (context creation
// fails, e.g. iOS under memory pressure / context limit): PixelBlast must
// degrade to the static frame instead of crashing the page.
vi.mock('three', () => {
  class WebGLRenderer {
    constructor() {
      throw new Error('WebGL context creation failed')
    }
  }
  return {
    WebGLRenderer,
    Texture: class {},
    LinearFilter: 0,
    GLSL3: 'GLSL3',
    Color: class {},
    Vector2: class {},
    OrthographicCamera: class {},
    ShaderMaterial: class {},
    PlaneGeometry: class {},
    Mesh: class {},
    Clock: class {
      getElapsedTime() {
        return 0
      }
    },
    Uniform: class {
      value: unknown
      constructor(value: unknown) {
        this.value = value
      }
    },
  }
})

vi.mock('postprocessing', () => ({
  Effect: class {},
  EffectComposer: class {},
  EffectPass: class {},
  RenderPass: class {},
}))

import PixelBlast from './PixelBlast'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PixelBlast', () => {
  it('degrades to the static frame when the WebGL context cannot be created', async () => {
    let container: HTMLElement | undefined
    await act(async () => {
      const { container: c } = render(<PixelBlast variant="square" />)
      container = c as HTMLElement
    })

    // The effect runs after render; give it a tick to attempt context creation.
    await act(async () => {
      await Promise.resolve()
    })

    const frame = container?.querySelector('.pixel-blast-container')
    expect(frame).not.toBeNull()
    expect(frame!.className).toContain('static-frame')
    // No canvas from a failed renderer is left on screen.
    expect(frame!.querySelector('canvas')).toBeNull()
  })
})
