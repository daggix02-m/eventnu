import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventForm } from './EventForm'

const { pushMock, refreshMock, toast } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}))

const { createEvent, updateEvent } = vi.hoisted(() => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}))

vi.mock('sonner', () => ({ toast }))

vi.mock('@/lib/actions/events', () => ({
  createEvent,
  updateEvent,
  getUploadUrl: vi.fn(),
  resolveStorageUrls: vi.fn(),
}))

const defaultProps = {
  mode: 'create' as const,
  categories: [],
  organizers: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EventForm', () => {
  it('blocks submit without a title or start date', async () => {
    const user = userEvent.setup()
    render(<EventForm {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(toast.error).toHaveBeenCalledWith('Title and start date are required')
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('still blocks when only the title is filled in', async () => {
    const user = userEvent.setup()
    render(<EventForm {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('Enter event title'), 'Jazz Night')
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(toast.error).toHaveBeenCalledWith('Title and start date are required')
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('creates a published event with title, date, and payload', async () => {
    const user = userEvent.setup()
    const { container } = render(<EventForm {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('Enter event title'), 'Jazz Night')
    const startDate = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    await user.type(startDate, '2026-09-01T19:00')
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Jazz Night',
        start_date: '2026-09-01T19:00',
        status: 'published',
        source: 'admin',
        action_type: 'open_entry',
        timezone: 'Africa/Addis_Ababa',
        categoryIds: [],
      }),
    )
    expect(toast.success).toHaveBeenCalledWith('Event published!')
    expect(pushMock).toHaveBeenCalledWith('/events')
  })

  it('saves a draft with status draft', async () => {
    const user = userEvent.setup()
    const { container } = render(<EventForm {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('Enter event title'), 'Jazz Night')
    const startDate = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    await user.type(startDate, '2026-09-01T19:00')
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Jazz Night', status: 'draft' }),
    )
    expect(toast.success).toHaveBeenCalledWith('Event saved as draft')
  })

  it('shows an error toast when creation fails', async () => {
    const user = userEvent.setup()
    createEvent.mockRejectedValueOnce(new Error('boom'))
    const { container } = render(<EventForm {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('Enter event title'), 'Jazz Night')
    const startDate = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    await user.type(startDate, '2026-09-01T19:00')
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    expect(toast.error).toHaveBeenCalledWith('boom')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('updates an existing event and refreshes', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const { container } = render(
      <EventForm
        mode="edit"
        eventId="evt_123"
        initial={{ title: 'Old Title' }}
        categories={[]}
        organizers={[]}
        onSaved={onSaved}
      />,
    )
    await user.clear(screen.getByPlaceholderText('Enter event title'))
    await user.type(screen.getByPlaceholderText('Enter event title'), 'New Title')
    const startDate = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    await user.type(startDate, '2026-09-01T19:00')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(updateEvent).toHaveBeenCalledWith(
      'evt_123',
      expect.objectContaining({ title: 'New Title', status: 'draft' }),
    )
    expect(toast.success).toHaveBeenCalledWith('Event updated successfully')
    expect(onSaved).toHaveBeenCalledOnce()
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  it('routes to /events when a draft is created', async () => {
    const user = userEvent.setup()
    const { container } = render(<EventForm {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('Enter event title'), 'Jazz Night')
    const startDate = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    await user.type(startDate, '2026-09-01T19:00')
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))
    expect(pushMock).toHaveBeenCalledWith('/events')
  })
})
