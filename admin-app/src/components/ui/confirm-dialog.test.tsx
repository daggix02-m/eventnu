import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders the title, description, and actions', () => {
    render(
      <ConfirmDialog
        open
        title="Delete event?"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete event?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('hides content when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete event?"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onConfirm with the confirm button', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog open title="Delete event?" onConfirm={onConfirm} onOpenChange={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onOpenChange(false) with Cancel', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog open title="Delete event?" onConfirm={vi.fn()} onOpenChange={onOpenChange} />,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses the custom confirm label and disables buttons while loading', () => {
    render(
      <ConfirmDialog
        open
        title="Delete event?"
        confirmLabel="Delete"
        loading
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )
    const confirm = screen.getByRole('button', { name: 'Delete' })
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
