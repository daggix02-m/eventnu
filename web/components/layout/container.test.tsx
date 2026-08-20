import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container } from './Container'

describe('Container', () => {
  it('renders children', () => {
    render(
      <Container>
        <p>Inside container</p>
      </Container>,
    )
    expect(screen.getByText('Inside container')).toBeInTheDocument()
  })

  it('applies container classes', () => {
    const { container } = render(<Container>Content</Container>)
    // The outermost div rendered by Container
    const wrapper = container.firstElementChild!
    expect(wrapper).toHaveClass('w-full')
    expect(wrapper).toHaveClass('max-w-container-max')
    expect(wrapper).toHaveClass('mx-auto')
  })

  it('applies custom className', () => {
    const { container } = render(<Container className="custom">Content</Container>)
    const wrapper = container.firstElementChild!
    expect(wrapper).toHaveClass('custom')
  })

  it('renders with an id attribute', () => {
    const { container } = render(<Container id="main-content">Content</Container>)
    const wrapper = container.firstElementChild!
    expect(wrapper).toHaveAttribute('id', 'main-content')
  })

  it('renders as a div', () => {
    const { container } = render(<Container>Content</Container>)
    const wrapper = container.firstElementChild!
    expect(wrapper.tagName).toBe('DIV')
  })
})
