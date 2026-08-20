'use client'

import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const DEFAULT_LENGTH = 10
const VALID_CHAR_RE = /^[A-Z0-9]$/

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  error?: boolean
  length?: number
  className?: string
}

export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  length = DEFAULT_LENGTH,
  className,
}: CodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const chars = Array.from({ length }, (_, i) => value[i] ?? '')

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1))
      inputRefs.current[clamped]?.focus()
      inputRefs.current[clamped]?.select()
    },
    [length],
  )

  const emitChange = useCallback(
    (next: string) => {
      const clean = next.toUpperCase().slice(0, length)
      onChange(clean)
      if (clean.length === length) {
        onComplete?.(clean)
      }
    },
    [onChange, onComplete, length],
  )

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const char = raw.slice(-1).toUpperCase()

      if (char && !VALID_CHAR_RE.test(char)) return

      const arr = value.split('')
      arr[index] = char
      emitChange(arr.join(''))

      if (char && index < length - 1) {
        focusInput(index + 1)
      }
    },
    [value, emitChange, focusInput, length],
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      const arr = value.split('')

      switch (e.key) {
        case 'Backspace': {
          if (arr[index]) {
            arr[index] = ''
            emitChange(arr.join(''))
          } else if (index > 0) {
            e.preventDefault()
            arr[index - 1] = ''
            emitChange(arr.join(''))
            focusInput(index - 1)
          }
          break
        }
        case 'Delete': {
          e.preventDefault()
          arr[index] = ''
          emitChange(arr.join(''))
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          if (index > 0) focusInput(index - 1)
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          if (index < length - 1) focusInput(index + 1)
          break
        }
        case 'Home': {
          e.preventDefault()
          focusInput(0)
          break
        }
        case 'End': {
          e.preventDefault()
          focusInput(length - 1)
          break
        }
      }
    },
    [value, emitChange, focusInput, length],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData
        .getData('text')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')

      if (!pasted) return

      emitChange(pasted.slice(0, length))
      focusInput(Math.min(pasted.length, length - 1))
    },
    [emitChange, focusInput, length],
  )

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  return (
    <div
      role="group"
      aria-label="Verification code"
      className={cn('flex gap-1.5 sm:gap-2', className)}
    >
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={2}
          value={char}
          disabled={disabled}
          aria-label={`Character ${i + 1} of ${length}`}
          aria-invalid={error || undefined}
          className={cn(
            'h-12 w-8 sm:h-14 sm:w-10',
            'rounded-xl border text-center font-mono text-lg font-semibold uppercase',
            'bg-surface-container-low text-on-surface',
            'placeholder:text-on-surface-variant',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error focus-visible:ring-error' : 'border-outline-variant',
          )}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
      <input type="hidden" name="verification_code" value={value} />
    </div>
  )
}
