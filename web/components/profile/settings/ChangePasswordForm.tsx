'use client'

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { Loader2 } from 'lucide-react'
import { FieldBox } from '@/components/ui/field-box'
import { Button } from '@/components/ui/button'

const MIN_PASSWORD_LENGTH = 8

const REASON_MESSAGES: Record<string, string> = {
  invalid_current_password: 'Your current password is incorrect.',
  rate_limited: 'Too many attempts — wait a moment and try again.',
  not_authenticated: 'Please sign in again.',
  password_too_short: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
}

export function ChangePasswordForm() {
  const changePassword = useAction(api.auth.changePassword)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canSubmit =
    current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && next === confirm && !busy

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const result = await changePassword({ currentPassword: current, newPassword: next })
      if (result.ok) {
        setSaved(true)
        setCurrent('')
        setNext('')
        setConfirm('')
      } else {
        setError(REASON_MESSAGES[result.reason] ?? 'Failed to change password.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-md rounded-2xl border border-outline-variant bg-surface-container-low p-md"
      aria-label="Change password"
    >
      <h2 className="font-display text-headline-sm text-on-surface">Change password</h2>
      <p className="font-body-sm text-on-surface-variant">
        Use a strong, unique password you don&apos;t use anywhere else.
      </p>

      <FieldBox
        label="Current password"
        type="password"
        showPasswordToggle
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value)
          setSaved(false)
        }}
        autoComplete="current-password"
      />
      <FieldBox
        label="New password"
        type="password"
        showPasswordToggle
        value={next}
        onChange={(e) => {
          setNext(e.target.value)
          setSaved(false)
        }}
        autoComplete="new-password"
      />
      <FieldBox
        label="Confirm new password"
        type="password"
        showPasswordToggle
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value)
          setSaved(false)
        }}
        autoComplete="new-password"
      />

      {error && (
        <p role="alert" className="font-body-sm text-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="font-body-sm text-primary">
          Password updated
        </p>
      )}

      <Button type="submit" disabled={!canSubmit}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Update password
      </Button>
    </form>
  )
}
