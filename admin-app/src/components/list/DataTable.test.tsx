import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './DataTable'

interface Row {
  id: string
  name: string
}

const columns = [{ key: 'name', header: 'Name', render: (row: Row) => row.name }]

const rows: Row[] = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
]

describe('DataTable', () => {
  it('renders headers and rows', () => {
    render(<DataTable<Row> data={rows} columns={columns} rowKey={(r) => r.id} empty={null} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('renders the empty state when there is no data', () => {
    render(
      <DataTable<Row>
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
        empty={<p>Nothing here</p>}
      />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('shows the empty state cell spanning selection + columns', () => {
    render(
      <DataTable<Row>
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
        empty={<p>Nothing here</p>}
        selection={{
          selectedIds: [],
          onToggleAll: () => {},
          onToggle: () => {},
          allSelected: false,
        }}
      />,
    )
    expect(screen.getByText('Nothing here').closest('td')).toHaveAttribute('colspan', '2')
  })

  it('calls onRowClick with the row and marks the selected row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const { container } = render(
      <DataTable<Row>
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
        selectedRowKey="a"
        empty={null}
      />,
    )
    await user.click(screen.getByText('Alpha'))
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
    expect(container.querySelectorAll('tr')[1]).toHaveClass('bg-surface-container-high')
  })

  it('toggles selection via the row checkbox', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <DataTable<Row>
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        empty={null}
        selection={{
          selectedIds: [],
          onToggleAll: () => {},
          onToggle,
          allSelected: false,
        }}
      />,
    )
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])
    expect(onToggle).toHaveBeenCalledWith('a', true)
  })

  it('toggles all via the header checkbox', async () => {
    const user = userEvent.setup()
    const onToggleAll = vi.fn()
    render(
      <DataTable<Row>
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        empty={null}
        selection={{
          selectedIds: ['a', 'b'],
          onToggleAll,
          onToggle: () => {},
          allSelected: true,
        }}
      />,
    )
    await user.click(screen.getByLabelText('Select all rows'))
    expect(onToggleAll).toHaveBeenCalledWith(false)
  })

  it('applies the loading style', () => {
    const { container } = render(
      <DataTable<Row> data={rows} columns={columns} rowKey={(r) => r.id} empty={null} loading />,
    )
    expect(container.firstElementChild).toHaveClass('opacity-60')
  })

  it('renders the footer', () => {
    render(
      <DataTable<Row>
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        empty={null}
        footer={<div>Footer</div>}
      />,
    )
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
