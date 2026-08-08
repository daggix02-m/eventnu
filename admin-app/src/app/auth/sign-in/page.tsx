'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'

export default function SignIn() {
  const router = useRouter()
  const { signIn, signOut } = useAuthActions()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const clearError = (field: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: '' }))

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('flow', 'signIn')
      await signOut()
      await signIn('password', formData)
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Authentication failed')
      toast.error(msg)
      setFieldErrors({ email: 'Invalid email or password', password: 'Invalid email or password' })
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
            <h1 className="font-headline text-xl font-semibold text-foreground tracking-tight">Event Nu</h1>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Admin · Addissuite</p>
          </div>
        </div>

        <Card className="border-0 shadow-[0_2px_4px_rgba(30,20,10,0.04),0_8px_24px_rgba(30,20,10,0.08)] rounded-2xl overflow-hidden bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</CardTitle>
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
              <Button className="w-full h-11" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access only.
        </p>
      </div>
    </div>
  )
}
