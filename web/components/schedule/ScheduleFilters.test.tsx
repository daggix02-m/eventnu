import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleFilters, type ScheduleFiltersProps } from './ScheduleFilters'

const categories = [
  { id: 'cat_1', slug: 'music', name: 'Music', parent_id: undefined },
  { id: 'cat_2', slug: 'arts', name: 'Arts', parent_id: undefined },
]

function renderFilters(overrides: Partial<ScheduleFiltersProps> = {}) {
  const props: ScheduleFiltersProps = {
    timeFilter: 'all',
    onTimeFilterChange: vi.fn(),
    selectedCategory: null,
    onCategoryChange: vi.fn(),
    categories,
    onRollDice: vi.fn(),
    isRollingDice: false,
    eventsCountOnDate: 5,
    ...overrides,
  }
  return render(<ScheduleFilters {...props} />)
}

describe('ScheduleFilters', () => {
  it('marks the active time-of-day pill as pressed', () => {
    renderFilters({ timeFilter: 'golden' })
    expect(screen.getByRole('button', { name: /golden hour/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /all hours/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('marks the selected category pill as pressed', () => {
    renderFilters({ selectedCategory: 'music' })
    expect(screen.getByRole('button', { name: /^music$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^all vibes$/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
