'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'
import { describeSignInError, isNetworkError, INVALID_CREDENTIALS } from '@/lib/auth'

export default function SignIn() {
  const router = useRouter()
  const { signIn } = useAuthActions()

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

    const errs: Record<string, string> = {}
    if (!inputEmail) {
      errs.email = 'Please enter your email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!password) {
      errs.password = 'Please enter your password.'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setLoading(false)
      return
    }

    let result: { signingIn: boolean } | null = null

    try {
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
      const msg = describeSignInError(err, getErrorMessage(err, 'Authentication failed'))
      toast.error(msg)
      if (msg === INVALID_CREDENTIALS) {
        setFieldErrors({ email: msg, password: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
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
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
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
            {fieldErrors.email && <p className="text-destructive text-xs">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-1 relative">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                onChange={() => clearError('password')}
                aria-invalid={!!fieldErrors.password}
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
  )
}
