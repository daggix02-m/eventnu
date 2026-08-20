import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CodeInput } from './CodeInput'

function renderCodeInput(props: Partial<React.ComponentProps<typeof CodeInput>> = {}) {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    ...props,
  }
  return { ...defaultProps, ...render(<CodeInput {...defaultProps} />) }
}

describe('CodeInput', () => {
  it('renders 10 input slots by default', () => {
    renderCodeInput()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(10)
  })

  it('renders custom length when specified', () => {
    renderCodeInput({ length: 6 })
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('has proper aria-labels on each slot', () => {
    renderCodeInput()
    expect(screen.getByRole('textbox', { name: 'Character 1 of 10' })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Character 10 of 10' })).toBeDefined()
  })

  it('has role="group" container with aria-label', () => {
    renderCodeInput()
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeDefined()
  })

  it('calls onChange with the typed character', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(firstInput, { target: { value: 'A' } })
    expect(onChange).toHaveBeenCalledWith('A')
  })

  it('auto-uppercases lowercase input', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(firstInput, { target: { value: 'a' } })
    expect(onChange).toHaveBeenCalledWith('A')
  })

  it('filters out invalid characters', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(firstInput, { target: { value: '!' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('filters out lowercase non-alpha characters', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(firstInput, { target: { value: '#' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('accepts digits', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(firstInput, { target: { value: '5' } })
    expect(onChange).toHaveBeenCalledWith('5')
  })

  it('calls onComplete when all slots are filled via paste', () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    renderCodeInput({ onChange, onComplete })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: () => 'ABCDEFGHJK',
      },
    })
    expect(onComplete).toHaveBeenCalledWith('ABCDEFGHJK')
  })

  it('does not call onComplete when partially filled', () => {
    const onComplete = vi.fn()
    renderCodeInput({ onComplete })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(firstInput, { target: { value: 'ABC' } })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('clears previous slot on backspace when current is empty', () => {
    const onChange = vi.fn()
    renderCodeInput({ value: 'AB', onChange })
    const thirdInput = screen.getAllByRole('textbox')[2]
    fireEvent.keyDown(thirdInput, { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith('A')
  })

  it('clears current slot on backspace when it has a value', () => {
    const onChange = vi.fn()
    renderCodeInput({ value: 'ABC', onChange })
    const thirdInput = screen.getAllByRole('textbox')[2]
    fireEvent.keyDown(thirdInput, { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith('AB')
  })

  it('moves focus left on ArrowLeft', () => {
    renderCodeInput({ value: 'ABC' })
    const thirdInput = screen.getAllByRole('textbox')[2]
    const secondInput = screen.getAllByRole('textbox')[1]
    const focusSpy = vi.spyOn(secondInput, 'focus')
    fireEvent.keyDown(thirdInput, { key: 'ArrowLeft' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('moves focus right on ArrowRight', () => {
    renderCodeInput({ value: 'ABC' })
    const thirdInput = screen.getAllByRole('textbox')[2]
    const fourthInput = screen.getAllByRole('textbox')[3]
    const focusSpy = vi.spyOn(fourthInput, 'focus')
    fireEvent.keyDown(thirdInput, { key: 'ArrowRight' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('jumps to first slot on Home', () => {
    renderCodeInput({ value: 'ABCDE' })
    const thirdInput = screen.getAllByRole('textbox')[2]
    const firstInput = screen.getAllByRole('textbox')[0]
    const focusSpy = vi.spyOn(firstInput, 'focus')
    fireEvent.keyDown(thirdInput, { key: 'Home' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('jumps to last slot on End', () => {
    renderCodeInput({ value: 'ABCDE' })
    const thirdInput = screen.getAllByRole('textbox')[2]
    const tenthInput = screen.getAllByRole('textbox')[9]
    const focusSpy = vi.spyOn(tenthInput, 'focus')
    fireEvent.keyDown(thirdInput, { key: 'End' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('clears current slot on Delete', () => {
    const onChange = vi.fn()
    renderCodeInput({ value: 'ABC', onChange })
    const thirdInput = screen.getAllByRole('textbox')[2]
    fireEvent.keyDown(thirdInput, { key: 'Delete' })
    expect(onChange).toHaveBeenCalledWith('AB')
  })

  it('disables all inputs when disabled prop is true', () => {
    renderCodeInput({ disabled: true })
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      expect(input).toBeDisabled()
    })
  })

  it('sets aria-invalid when error prop is true', () => {
    renderCodeInput({ error: true })
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('includes hidden input for form submission', () => {
    renderCodeInput({ value: 'ABCDEFGHIJ' })
    const hiddenInput = document.querySelector('input[type="hidden"]') as HTMLInputElement
    expect(hiddenInput).toBeDefined()
    expect(hiddenInput.value).toBe('ABCDEFGHIJ')
  })

  it('truncates pasted content to length', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange, length: 6 })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: () => 'ABCDEFGH',
      },
    })
    expect(onChange).toHaveBeenCalledWith('ABCDEF')
  })

  it('strips non-alphanumeric chars from pasted content', () => {
    const onChange = vi.fn()
    renderCodeInput({ onChange })
    const firstInput = screen.getAllByRole('textbox')[0]
    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: () => 'AB CD-EF',
      },
    })
    expect(onChange).toHaveBeenCalledWith('ABCDEF')
  })

  it('has inputMode="text" for mobile keyboard', () => {
    renderCodeInput()
    const firstInput = screen.getAllByRole('textbox')[0]
    expect(firstInput).toHaveAttribute('inputmode', 'text')
  })

  it('has autoComplete="one-time-code" on first slot', () => {
    renderCodeInput()
    const firstInput = screen.getAllByRole('textbox')[0]
    expect(firstInput).toHaveAttribute('autocomplete', 'one-time-code')
  })
})
