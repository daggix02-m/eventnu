import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}

export function FormField({ label, required, optional, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
        {optional && (
          <span className="ml-1.5 text-slate-400 normal-case font-normal">
            (optional)
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
