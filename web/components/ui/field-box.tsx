'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldBoxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  showPasswordToggle?: boolean
  error?: string
  invalid?: boolean
}

const FieldBox = React.forwardRef<HTMLInputElement, FieldBoxProps>(
  (
    {
      className,
      label,
      type,
      id,
      showPasswordToggle = false,
      error,
      invalid = false,
      value,
      onChange,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!value)
    const [focused, setFocused] = React.useState(false)
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    const isPassword = type === 'password'
    const resolvedType = isPassword && showPassword ? 'text' : type
    const isActive = focused || hasValue

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      if (!e.target.value) setHasValue(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      onChange?.(e)
    }

    return (
      <div className="relative">
        <div className="relative h-14">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isActive ? props.placeholder : ' '}
            aria-invalid={invalid || !!error || undefined}
            aria-describedby={invalid || error ? errorId : undefined}
            className={cn(
              'peer absolute inset-0 w-full rounded-xl border bg-surface-container-low px-md pt-4 pb-1 text-body-md text-on-surface',
              'placeholder:text-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-error focus-visible:ring-error'
                : isActive
                  ? 'border-primary'
                  : 'border-outline-variant',
              showPasswordToggle && 'pr-14',
              className,
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute left-md transition-all duration-200',
              isActive
                ? 'top-1.5 text-label-sm text-primary'
                : 'top-1/2 -translate-y-1/2 text-body-md text-on-surface-variant',
            )}
          >
            {label}
          </label>
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:text-on-surface"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {(error || invalid) && (
          <p id={errorId} className={error ? 'mt-1 text-sm text-error' : 'sr-only'} role="alert">
            {error || ''}
          </p>
        )}
      </div>
    )
  },
)
FieldBox.displayName = 'FieldBox'

export { FieldBox }
