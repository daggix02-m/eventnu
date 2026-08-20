'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Container } from '@/components/layout/Container'
import { getEmail, storeEmail } from '@/lib/auth-storage'

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('TooManyFailedAttempts')) {
      return 'Too many attempts. Please try again later.'
    }
    if (
      msg.includes('Could not connect') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed')
    ) {
      return 'Could not reach the server. Check your connection and try again.'
    }
    if (msg.includes('Password reset is not enabled')) {
      return 'Password reset is not available. Please contact support.'
    }
  }
  return 'Could not send the reset code. Please try again.'
}

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState(() => getEmail() ?? '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const hasEmail = email.trim().length > 0

  const sendReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.set('email', email.trim().toLowerCase())
      formData.set('flow', 'reset')
      formData.set('redirectTo', '/auth/reset-password')
      await signIn('password', formData)
      storeEmail(email.trim().toLowerCase())
      setSent(true)
    } catch (err: unknown) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendReset()
  }

  return (
    <Container className="py-xl flex justify-center">
      <div className="w-full max-w-[28rem] space-y-md">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-headline-md text-on-surface">
            {sent ? 'Check your email' : 'Reset your password'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {sent
              ? `We sent a reset code to ${email}`
              : 'Enter your email and we\u2019ll send you a code to reset your password.'}
          </p>
        </div>

        {sent ? (
          <div className="space-y-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <div className="flex items-start gap-sm rounded-lg bg-surface-container-high p-md">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-body-sm text-on-surface-variant">
                Open the email and click the reset link, or open the reset page and enter the code
                from the email.
              </p>
            </div>
            <Button asChild className="h-11 w-full">
              <Link href="/auth/reset-password">Go to reset password</Link>
            </Button>
            <div className="flex justify-center">
              <Link
                href="/auth"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            {hasEmail ? (
              <div className="space-y-sm">
                <p className="text-body-md text-on-surface-variant">
                  Send a reset code to <strong className="text-on-surface">{email}</strong>?
                </p>
                {error && (
                  <p role="alert" className="text-body-sm text-error">
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  className="h-11 w-full"
                  disabled={loading}
                  onClick={() => void sendReset()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    'Send reset code'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="block w-full text-center text-sm text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-sm">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    'Send reset code'
                  )}
                </Button>
              </form>
            )}
            <div className="flex justify-center">
              <Link
                href="/auth"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
