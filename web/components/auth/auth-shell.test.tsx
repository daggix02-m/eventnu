import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AuthShell } from './AuthShell'

// Mock next/image to avoid layout shifts in tests
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt?: string; [key: string]: unknown }) => {
    return <img alt={alt ?? ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  },
}))

// Mock motion to pass through children without animation
vi.mock('motion/react', () => {
  const createMotionComponent = (tag: string) => {
    const Component = ({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: {
      children?: React.ReactNode
      initial?: unknown
      animate?: unknown
      exit?: unknown
      transition?: unknown
      [key: string]: unknown
    }) => {
      return React.createElement(tag, props, children)
    }
    Component.displayName = `motion.${tag}`
    return Component
  }

  const MotionConfig = ({
    children,
    reducedMotion,
  }: {
    children?: React.ReactNode
    reducedMotion?: string
  }) => React.createElement(React.Fragment, null, children)

  return {
    motion: new Proxy(
      {},
      {
        get: (_target: object, tag: string | symbol) => {
          if (typeof tag === 'string') {
            return createMotionComponent(tag)
          }
        },
      },
    ),
    MotionConfig,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  }
})

describe('AuthShell', () => {
  const defaultProps = {
    title: 'Sign In',
    description: 'Welcome back',
    asideTitle: 'Make room for a good time.',
    asideDescription: 'Discover events.',
  }

  it('renders the main heading', () => {
    render(<AuthShell {...defaultProps}>content</AuthShell>)
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('renders the aside heading on desktop', () => {
    render(<AuthShell {...defaultProps}>content</AuthShell>)
    expect(screen.getByRole('heading', { name: 'Make room for a good time.' })).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<AuthShell {...defaultProps}>Test content</AuthShell>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders benefit items in a list with accessible label', () => {
    render(<AuthShell {...defaultProps}>content</AuthShell>)
    expect(screen.getByRole('list', { name: 'Account benefits' })).toBeInTheDocument()
    expect(screen.getByText('Find your next plan')).toBeInTheDocument()
    expect(screen.getByText('Browse what is happening now.')).toBeInTheDocument()
  })

  it('renders marketing aside with visible aria-label', () => {
    render(<AuthShell {...defaultProps}>content</AuthShell>)
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveAttribute('aria-label', 'Event Nu benefits')
  })

  it('renders footer links when showTermsFooter is true (default)', () => {
    render(<AuthShell {...defaultProps}>content</AuthShell>)
    expect(screen.getByText('Terms')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('hides footer when showTermsFooter is false', () => {
    render(
      <AuthShell {...defaultProps} showTermsFooter={false}>
        content
      </AuthShell>,
    )
    expect(screen.queryByText('Terms')).not.toBeInTheDocument()
    expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument()
  })

  it('has overscroll-behavior on outer div', () => {
    const { container } = render(<AuthShell {...defaultProps}>content</AuthShell>)
    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('overscroll-y-contain')
  })

  it('grid overlay has aria-hidden', () => {
    render(<AuthShell {...defaultProps}>content</AuthShell>)
    const grid = document.querySelector('[aria-hidden="true"]')
    expect(grid).toBeInTheDocument()
  })
})
