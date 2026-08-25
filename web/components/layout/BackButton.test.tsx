import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackButton } from './BackButton'

const mockUsePathname = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ back: mockBack }),
}))

describe('BackButton', () => {
  beforeEach(() => {
    mockUsePathname.mockReset()
    mockBack.mockReset()
  })

  it('renders a back button with a Back label when there is in-app history', () => {
    mockUsePathname.mockReturnValue('/events/some-event')
    render(<BackButton historyLength={3} />)
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('pops browser history when clicked', async () => {
    const user = userEvent.setup()
    mockUsePathname.mockReturnValue('/events/some-event')
    render(<BackButton historyLength={3} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('renders nothing on the home page', () => {
    mockUsePathname.mockReturnValue('/')
    const { container } = render(<BackButton historyLength={3} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when there is no in-app history to go back to', () => {
    mockUsePathname.mockReturnValue('/events/some-event')
    const { container } = render(<BackButton historyLength={1} />)
    expect(container).toBeEmptyDOMElement()
  })
})
