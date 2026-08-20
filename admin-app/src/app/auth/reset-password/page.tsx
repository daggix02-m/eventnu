'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'
import { describeSignInError, RESET_EMAIL_KEY, getStoredEmail, clearStoredEmail } from '@/lib/auth'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()

  const codeFromUrl = searchParams.get('code') ?? ''
  const [email, setEmail] = useState(() => getStoredEmail(RESET_EMAIL_KEY))
  const [code, setCode] = useState(codeFromUrl)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required. Request a new reset link from the forgot-password page.')
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
      clearStoredEmail(RESET_EMAIL_KEY)
      if (result.signingIn) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/auth/sign-in')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(describeSignInError(err, getErrorMessage(err, 'Could not reset your password')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-[0_2px_4px_rgba(30,20,10,0.04),0_8px_24px_rgba(30,20,10,0.08)] rounded-2xl overflow-hidden bg-card">
      <CardHeader className="space-y-1 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
          Choose a new password
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter the reset code from your email and your new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@eventnu.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              Reset code
            </label>
            <Input
              id="code"
              name="code"
              type="text"
              autoComplete="one-time-code"
              placeholder="e.g. 8AB2K9DXHN"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-11 font-mono tracking-[0.2em] text-center"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <Input
                id="new-password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full h-11" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Resetting…
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Reset password
              </>
            )}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/auth/forgot-password" className="text-primary hover:underline font-medium">
            Request a new reset link
          </Link>
          {' · '}
          <Link href="/auth/sign-in" className="text-primary hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-surface-container-low">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
