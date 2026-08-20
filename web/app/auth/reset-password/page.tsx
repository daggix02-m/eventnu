'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Container } from '@/components/layout/Container'
import { CodeInput } from '@/components/auth/CodeInput'
import { getPasswordStrength } from '@/components/auth/AuthPage'
import { getEmail, storeEmail } from '@/lib/auth-storage'

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Invalid code') || msg.includes('invalid code')) {
      return 'The code is incorrect. Check your email and try again.'
    }
    if (msg.includes('expired') || msg.includes('Expired')) {
      return 'This code has expired. Request a new one from the forgot password page.'
    }
    if (msg.includes('TooManyFailedAttempts')) {
      return 'Too many attempts. Please try again later.'
    }
    if (msg.includes('Password') && msg.includes('length')) {
      return 'Password must be at least 8 characters.'
    }
    if (
      msg.includes('Could not connect') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed')
    ) {
      return 'Could not reach the server. Check your connection and try again.'
    }
  }
  return 'Could not reset your password. Please try again.'
}

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()

  const codeFromUrl = searchParams.get('code') ?? ''
  const [email, setEmail] = useState(() => getEmail() ?? '')
  const [code, setCode] = useState(codeFromUrl)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = getPasswordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required. Request a new reset link from the forgot password page.')
      return
    }
    if (!code.trim()) {
      setError('Enter the reset code from your email.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('email', email.trim().toLowerCase())
      formData.set('code', code.trim().toUpperCase())
      formData.set('newPassword', newPassword)
      formData.set('flow', 'reset-verification')
      formData.set('redirectTo', '/auth/callback')

      const result = await signIn('password', formData)
      storeEmail(email.trim().toLowerCase())
      if (result.signingIn) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/auth/sign-in')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-xl flex justify-center">
      <div className="w-full max-w-[28rem] space-y-md">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-headline-md text-on-surface">Choose a new password</h1>
          <p className="text-body-md text-on-surface-variant">
            Enter the reset code from your email and your new password.
          </p>
        </div>

        <div className="space-y-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
          <form onSubmit={handleSubmit} noValidate className="space-y-sm">
            <div className="space-y-1.5">
              <Label htmlFor="rp-email">Email</Label>
              <Input
                id="rp-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp-code">Code</Label>
              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={() => {}}
                error={!!error && error.includes('code')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp-new-password">New password</Label>
              <div className="relative">
                <Input
                  id="rp-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-outline-variant">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant">{strength.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rp-confirm-password">Confirm password</Label>
              <Input
                id="rp-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-body-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Reset password
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-on-surface-variant">
            <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
              Request a new reset link
            </Link>
            {' · '}
            <Link href="/auth" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </Container>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-xl flex justify-center">
          <div className="flex items-center gap-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-body-md text-on-surface-variant">Loading…</p>
          </div>
        </Container>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
