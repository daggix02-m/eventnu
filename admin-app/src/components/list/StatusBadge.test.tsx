import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

const variants = {
  draft: 'outline',
  published: 'success',
} as const

describe('StatusBadge', () => {
  it('renders the value as-is when no labels are provided', () => {
    render(<StatusBadge value="draft" variants={variants} />)
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('replaces underscores with spaces for display', () => {
    render(<StatusBadge value="pending_review" variants={variants} />)
    expect(screen.getByText('pending review')).toBeInTheDocument()
  })

  it('uses the label map when provided', () => {
    render(<StatusBadge value="published" labels={{ published: 'Live' }} variants={variants} />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('applies the mapped variant and falls back to outline', () => {
    const { container } = render(<StatusBadge value="published" variants={variants} />)
    expect(container.querySelector('div')).toHaveClass('text-success')

    const { container: fallback } = render(<StatusBadge value="unknown" variants={variants} />)
    expect(fallback.querySelector('div')).toHaveClass('border-outline-variant')
  })
})
