import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <Pagination hasPrev={false} hasNext={false} onPrev={vi.fn()} onNext={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the current page indicator', () => {
    render(<Pagination hasPrev hasNext pageIndex={2} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('Page 2')).toBeInTheDocument()
  })

  it('disables prev on the first page and next when there is no next page', () => {
    const { rerender } = render(
      <Pagination hasPrev={false} hasNext onPrev={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).toBeEnabled()

    rerender(<Pagination hasPrev hasNext={false} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByLabelText('Previous page')).toBeEnabled()
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })

  it('calls onPrev and onNext', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(<Pagination hasPrev hasNext onPrev={onPrev} onNext={onNext} />)
    await user.click(screen.getByLabelText('Previous page'))
    expect(onPrev).toHaveBeenCalledTimes(1)
    await user.click(screen.getByLabelText('Next page'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('respects the disabled flag', () => {
    render(<Pagination hasPrev hasNext onPrev={vi.fn()} onNext={vi.fn()} disabled />)
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })
})
