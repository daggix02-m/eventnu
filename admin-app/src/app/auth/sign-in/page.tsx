'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAction } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'
import { describeSignInError, isNetworkError, INVALID_CREDENTIALS, RATE_LIMITED } from '@/lib/auth'

const VERIFY_RESULT_MESSAGES = {
  invalid_account: 'No admin account found for this email.',
  invalid_secret: 'Incorrect password.',
  rate_limited: RATE_LIMITED,
} as const

function verifyResultMessage(reason: keyof typeof VERIFY_RESULT_MESSAGES): string {
  return VERIFY_RESULT_MESSAGES[reason]
}

export default function SignIn() {
  const router = useRouter()
  const { signIn } = useAuthActions()
  const verify = useAction(api.verifyPassword.verifyPassword)

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const clearError = (field: string) => setFieldErrors((prev) => ({ ...prev, [field]: '' }))

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('flow', 'signIn')
    const inputEmail = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!inputEmail || !password) {
      toast.error('Please enter your email and password.')
      setLoading(false)
      return
    }

    let verifyError: string | null = null

    try {
      try {
        const result = await verify({ email: inputEmail, password })
        if (!result.ok) {
          toast.error(verifyResultMessage(result.reason))
          if (result.reason === 'invalid_account') {
            setFieldErrors({ email: verifyResultMessage('invalid_account') })
          } else if (result.reason === 'invalid_secret') {
            setFieldErrors({ password: verifyResultMessage('invalid_secret') })
          }
          return
        }
      } catch (err: unknown) {
        verifyError = describeSignInError(err, getErrorMessage(err, 'Authentication failed'))
      }

      let result: { signingIn: boolean } | null = null
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await signIn('password', formData)
          break
        } catch (err: unknown) {
          if (attempt === 0 && isNetworkError(err)) continue
          throw err
        }
      }

      if (result?.signingIn) {
        router.push('/')
        router.refresh()
      } else {
        toast.error('Sign in failed. Please try again.')
      }
    } catch (err: unknown) {
      const msg = describeSignInError(
        err,
        verifyError ?? getErrorMessage(err, 'Authentication failed'),
      )
      toast.error(msg)
      if (msg === INVALID_CREDENTIALS) {
        setFieldErrors({ email: msg, password: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-headline font-bold text-lg shadow-sm">
            En
          </div>
          <div className="text-left">
            <h1 className="font-headline text-xl font-semibold text-foreground tracking-tight">
              Event Nu
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Admin · Addissuite
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-[0_2px_4px_rgba(30,20,10,0.04),0_8px_24px_rgba(30,20,10,0.08)] rounded-2xl overflow-hidden bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in with your admin credentials
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <div className="space-y-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@eventnu.et"
                  onChange={() => clearError('email')}
                  aria-invalid={!!fieldErrors.email}
                  className="h-11"
                />
                {fieldErrors.email && (
                  <p className="text-destructive text-xs">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-1 relative">
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    onChange={() => clearError('password')}
                    aria-invalid={!!fieldErrors.password}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-destructive text-xs">{fieldErrors.password}</p>
                )}
                <div className="flex justify-end pt-1">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <Button className="w-full h-11" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access only. Access is provisioned — contact the administrator if you need an
          account.
        </p>
      </div>
    </div>
  )
}
