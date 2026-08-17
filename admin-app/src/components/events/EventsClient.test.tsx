import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { MappedEvent } from '@/lib/mappers'
import { EventsClient } from './EventsClient'

const { useEventsMock, toast } = vi.hoisted(() => ({
  useEventsMock: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}))

const { updateEventStatus, bulkUpdateEventStatus, deleteEvent, featureEvent, unfeatureEvent } =
  vi.hoisted(() => ({
    updateEventStatus: vi.fn(),
    bulkUpdateEventStatus: vi.fn(),
    deleteEvent: vi.fn(),
    featureEvent: vi.fn(),
    unfeatureEvent: vi.fn(),
  }))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('sonner', () => ({ toast }))

vi.mock('@/lib/api/events', () => ({
  eventsKeys: ['events'],
  useEvents: useEventsMock,
}))

vi.mock('@/lib/actions/events', () => ({
  updateEventStatus,
  bulkUpdateEventStatus,
  deleteEvent,
  featureEvent,
  unfeatureEvent,
}))

function makeEvent(overrides: Partial<MappedEvent>): MappedEvent {
  return {
    id: 'evt_1',
    title: 'Event',
    slug: 'event',
    description: '',
    start_date: '2026-09-01T19:00',
    end_date: '',
    poster_url: undefined,
    image_aspect_ratio: undefined,
    insta_permalink: undefined,
    insta_post_id: undefined,
    teaser_video_url: undefined,
    video_aspect_ratio: undefined,
    external_link: undefined,
    external_link_label: undefined,
    price_display: undefined,
    contact_email: undefined,
    is_free: true,
    action_type: 'open_entry',
    status: 'published',
    source: 'admin',
    owner_id: undefined,
    is_standalone: true,
    is_featured: false,
    featured_section: undefined,
    featured_until: '1970-01-01T00:00:00.000Z',
    frequency_type: 'one_time',
    reservation_limit: undefined,
    like_count: 0,
    timezone: 'Africa/Addis_Ababa',
    venue_name: '',
    venue_address: undefined,
    venue_map_link: undefined,
    admin_note: undefined,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const events = [
  makeEvent({ id: 'evt_pub', title: 'Jazz Night' }),
  makeEvent({ id: 'evt_pending', title: 'Art Expo', status: 'pending_review', like_count: 3 }),
]

function renderWith(rows: MappedEvent[]) {
  const queryClient = new QueryClient()
  useEventsMock.mockReturnValue({
    data: { items: rows, nextCursor: null, isDone: true },
    isFetching: false,
    hasPrev: false,
    hasNext: false,
    next: vi.fn(),
    prev: vi.fn(),
    pageIndex: 1,
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <EventsClient
        initial={{ items: rows, nextCursor: null, isDone: true }}
        initialFilters={{ search: '', status: 'all', source: 'all', frequency: 'all' }}
      />
    </QueryClientProvider>,
  )
}

function renderClient() {
  return renderWith(events)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EventsClient', () => {
  it('renders the seeded events', () => {
    renderClient()
    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument()
    expect(screen.getByText('Jazz Night')).toBeInTheDocument()
    expect(screen.getByText('Art Expo')).toBeInTheDocument()
  })

  it('bulk publishes the selected events', async () => {
    const user = userEvent.setup()
    renderClient()

    const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' })
    expect(rowCheckboxes).toHaveLength(2)
    await user.click(rowCheckboxes[1])
    expect(screen.getByText('1 selected')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bulk Publish' }))
    await waitFor(() =>
      expect(bulkUpdateEventStatus).toHaveBeenCalledWith(['evt_pending'], 'published'),
    )
    expect(toast.success).toHaveBeenCalledWith('1 events published')
  })

  it('deselects before running a bulk action', async () => {
    const user = userEvent.setup()
    renderClient()

    await user.click(screen.getAllByRole('checkbox', { name: 'Select row' })[1])
    await user.click(screen.getByRole('button', { name: 'Deselect' }))
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bulk Publish' })).not.toBeInTheDocument()
  })

  it('publishes a pending event from the row action menu', async () => {
    const user = userEvent.setup()
    renderClient()

    const menus = screen.getAllByLabelText('More actions')
    await user.click(menus[1])
    await user.click(screen.getByRole('button', { name: /Publish/ }))

    await waitFor(() => expect(updateEventStatus).toHaveBeenCalledWith('evt_pending', 'published'))
    expect(toast.success).toHaveBeenCalledWith('Event published successfully')
  })

  it('deletes an event through the confirm dialog', async () => {
    const user = userEvent.setup()
    renderClient()

    await user.click(screen.getAllByLabelText('More actions')[1])
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Delete event?')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith('evt_pending'))
    expect(toast.success).toHaveBeenCalledWith('Event deleted successfully')
  })

  it('archives a published event from the action menu', async () => {
    const user = userEvent.setup()
    renderClient()

    await user.click(screen.getAllByLabelText('More actions')[0])
    await user.click(screen.getByRole('button', { name: 'Archive' }))

    await waitFor(() => expect(updateEventStatus).toHaveBeenCalledWith('evt_pub', 'archived'))
    expect(toast.success).toHaveBeenCalledWith('Event archived successfully')
  })

  it('features and unfeatures an event from the action menu', async () => {
    const user = userEvent.setup()
    renderClient()

    await user.click(screen.getAllByLabelText('More actions')[0])
    await user.click(screen.getByRole('button', { name: 'Feature' }))
    await waitFor(() =>
      expect(featureEvent).toHaveBeenCalledWith('evt_pub', 'editors_choice', null),
    )
    expect(toast.success).toHaveBeenCalledWith('Event featured successfully')
  })

  it('restores an archived event to draft', async () => {
    const user = userEvent.setup()
    const archived = [
      events[0],
      makeEvent({ id: 'evt_arch', title: 'Old Expo', status: 'archived' }),
    ]
    renderWith(archived)

    await user.click(screen.getAllByLabelText('More actions')[1])
    await user.click(screen.getByRole('button', { name: 'Restore to Draft' }))

    await waitFor(() => expect(updateEventStatus).toHaveBeenCalledWith('evt_arch', 'draft'))
    expect(toast.success).toHaveBeenCalledWith('Event draft successfully')
  })

  it('unfeatures a featured event from the action menu', async () => {
    const user = userEvent.setup()
    renderWith([
      makeEvent({
        id: 'evt_feat',
        title: 'Featured Fest',
        is_featured: true,
        featured_section: 'editors_choice',
      }),
    ])

    await user.click(screen.getByLabelText('More actions'))
    await user.click(screen.getByRole('button', { name: 'Unfeature' }))

    await waitFor(() => expect(unfeatureEvent).toHaveBeenCalledWith('evt_feat'))
    expect(toast.success).toHaveBeenCalledWith('Event unfeatured successfully')
  })

  it('surfaces a status action failure as an error toast', async () => {
    const user = userEvent.setup()
    updateEventStatus.mockRejectedValueOnce(new Error('server down'))
    renderClient()

    await user.click(screen.getAllByLabelText('More actions')[0])
    await user.click(screen.getByRole('button', { name: 'Archive' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('server down'))
  })
})
