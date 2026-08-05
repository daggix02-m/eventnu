'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from 'company-design-system'
import { Input } from 'company-design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'company-design-system'
import { toast } from 'sonner'
import { Eye, EyeOff, Shield } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const { signIn, signOut } = useAuthActions()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'signIn' | 'signUp'>('signIn')

  const clearError = (field: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: '' }))

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('flow', step)
      await signOut()
      await signIn('password', formData)
      router.push('/')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight">Event Nu Admin</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Enterprise Suite</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in with your admin credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <div className="space-y-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email') }}
                  aria-invalid={!!fieldErrors.email}
                  className="h-11"
                />
                {fieldErrors.email && <p className="text-destructive text-xs">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-1 relative">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError('password') }}
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
                {fieldErrors.password && <p className="text-destructive text-xs">{fieldErrors.password}</p>}
                <div className="flex justify-end pt-1">
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(step === 'signIn' ? 'signUp' : 'signIn')}
                className="text-xs text-primary hover:underline font-medium"
              >
                {step === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access only.
        </p>
      </div>
    </div>
  )
}
