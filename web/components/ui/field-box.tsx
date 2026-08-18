'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldBoxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  showPasswordToggle?: boolean
}

const FieldBox = React.forwardRef<HTMLInputElement, FieldBoxProps>(
  (
    { className, label, type, id, showPasswordToggle = false, value, onChange, onFocus, ...props },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!value)
    const [focused, setFocused] = React.useState(false)
    const generatedId = React.useId()
    const inputId = id ?? generatedId

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
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isActive ? props.placeholder : ' '}
          className={cn(
            'peer h-12 w-full rounded-xl border bg-surface-container-low px-md pt-5 pb-1 text-body-md text-on-surface',
            'placeholder:text-transparent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isActive ? 'border-primary' : 'border-outline-variant',
            showPasswordToggle && 'pr-12',
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
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-on-surface-variant transition-colors hover:text-on-surface"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    )
  },
)
FieldBox.displayName = 'FieldBox'

export { FieldBox }
