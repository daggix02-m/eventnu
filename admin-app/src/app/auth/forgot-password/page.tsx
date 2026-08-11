'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'
import { describeSignInError, RESET_EMAIL_KEY, setStoredEmail } from '@/lib/auth'

export default function ForgotPassword() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const sendReset = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email.')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('email', email.trim())
      formData.set('flow', 'reset')
      formData.set('redirectTo', '/auth/reset-password')
      await signIn('password', formData)
      setStoredEmail(RESET_EMAIL_KEY, email.trim())
      setSent(true)
    } catch (err: unknown) {
      toast.error(describeSignInError(err, getErrorMessage(err, 'Could not send the reset link')))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void sendReset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-headline font-bold text-lg shadow-sm">
            En
          </div>
          <div className="text-left">
            <h1 className="font-headline text-xl font-semibold text-foreground tracking-tight">Event Nu</h1>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Admin · Addissuite</p>
          </div>
        </div>

        <Card className="border-0 shadow-[0_2px_4px_rgba(30,20,10,0.04),0_8px_24px_rgba(30,20,10,0.08)] rounded-2xl overflow-hidden bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              {sent ? 'Check your email' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {sent
                ? `We sent a reset code to ${email}`
                : 'Enter your email and we’ll send you a code to reset your password.'}
            </CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <Mail size={16} className="mt-0.5 shrink-0 text-primary" />
                <p>
                  Open the email and click the reset link, or open the reset page and enter the code from the email.
                </p>
              </div>
              <Button asChild className="w-full h-11">
                <Link href="/auth/reset-password">Go to reset password</Link>
              </Button>
              <div className="flex justify-center">
                <Link href="/auth/sign-in" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          ) : (
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@eventnu.et"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button className="w-full h-11" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    'Send reset code'
                  )}
                </Button>
              </form>
              <div className="flex justify-center">
                <Link href="/auth/sign-in" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access only.
        </p>
      </div>
    </div>
  )
}
