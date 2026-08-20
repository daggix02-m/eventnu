'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Loader2, Mail } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'
import {
  redeemVerificationCode,
  AUTH_EMAIL_KEY,
  getStoredEmail,
  clearStoredEmail,
} from '@/lib/auth'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')

  const complete = useCallback(
    async (mail: string, verificationCode: string) => {
      setStatus('loading')
      setError('')
      try {
        await redeemVerificationCode(
          signIn,
          mail.trim().toLowerCase(),
          verificationCode.trim().toUpperCase(),
        )
        clearStoredEmail(AUTH_EMAIL_KEY)
        router.replace('/')
        router.refresh()
      } catch (err: unknown) {
        setStatus('error')
        const msg = getErrorMessage(err, 'Could not sign in. Please try again.')
        setError(
          msg.includes('expired') || msg.includes('Invalid') || msg.includes('verifier')
            ? 'This link is invalid or has expired. Please request a new one.'
            : msg,
        )
      }
    },
    [router, signIn],
  )

  useEffect(() => {
    const urlCode = searchParams.get('code')
    const mail = getStoredEmail(AUTH_EMAIL_KEY)

    if (urlCode) {
      if (mail) {
        void complete(mail, urlCode)
      } else {
        setEmail('')
        setCode(urlCode)
        setStatus('idle')
      }
    } else {
      setStatus('idle')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || !code.trim()) {
      setError('Please enter both your email and the code from the email.')
      return
    }
    void complete(email, code)
  }

  return (
    <Card className="border-0 shadow-[0_2px_4px_rgba(30,20,10,0.04),0_8px_24px_rgba(30,20,10,0.08)] rounded-2xl overflow-hidden bg-card">
      <CardHeader className="space-y-1 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
          Finishing sign in…
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Verifying your link and signing you in.
        </CardDescription>
      </CardHeader>

      {status === 'loading' && (
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">This should only take a moment.</p>
        </CardContent>
      )}

      {status === 'error' && (
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Request a new sign-in link from the sign-in form and try again.
          </p>
          <Button asChild className="w-full h-11">
            <a href="/auth/sign-in">Back to sign in</a>
          </Button>
        </CardContent>
      )}

      {status === 'idle' && (
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <Mail size={16} className="mt-0.5 shrink-0 text-primary" />
            <p>
              Your email wasn’t saved in this browser. Enter the email you used and the code from
              the email to sign in.
            </p>
          </div>
          <form onSubmit={handleManualSubmit} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="cb-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="cb-email"
                type="email"
                autoComplete="email"
                placeholder="admin@eventnu.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="cb-code" className="text-sm font-medium text-foreground">
                Verification code
              </label>
              <Input
                id="cb-code"
                type="text"
                autoComplete="one-time-code"
                placeholder="e.g. 8AB2K9DXHN"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-11 font-mono tracking-[0.2em] text-center"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full h-11" type="submit">
              Verify and sign in
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-surface-container-low">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
