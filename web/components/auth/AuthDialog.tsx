'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, Mail, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TERMS_VERSION, TERMS_URL, PRIVACY_POLICY_URL } from '@/lib/terms'
import { redeemVerificationCode } from '@/lib/auth'

const EMAIL_KEY = 'eventnu_auth_email'
const REDIRECT_KEY = 'eventnu_auth_redirect'
const PENDING_TERMS_KEY = 'eventnu_pending_terms'

type View =
  | { name: 'signin' }
  | { name: 'signup' }
  | { name: 'magic' }
  | { name: 'code'; email: string }
  | { name: 'check'; email: string; message: string }

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Invalid credentials') || msg.includes('InvalidAccountId')) {
      return 'Invalid email or password.'
    }
    if (msg.includes('TooManyFailedAttempts')) {
      return 'Too many attempts. Please try again later.'
    }
    if (msg.includes('password') && msg.includes('length')) {
      return 'Password must be at least 8 characters.'
    }
    if (
      msg.includes('Could not connect') ||
      msg.includes('Failed to fetch') ||
      msg.includes('fetch failed')
    ) {
      return 'Could not reach the server. Check your connection and try again.'
    }
    if (msg.includes('Account not found')) {
      return 'No account found for this email.'
    }
    return msg
  }
  return 'Something went wrong. Please try again.'
}

async function ensureProfileWithRetry(
  ensureProfile: (args: { fullName?: string }) => Promise<unknown>,
  fullName?: string,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await ensureProfile({ fullName })
      return
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
}

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { signIn } = useAuthActions()
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const acceptTerms = useMutation(api.profiles.acceptTerms)

  const [view, setView] = useState<View>({ name: 'signin' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setView({ name: 'signin' })
    setName('')
    setEmail('')
    setPassword('')
    setCode('')
    setTermsChecked(false)
    setLoading(false)
    setError('')
  }

  const storeContext = (mail: string) => {
    try {
      sessionStorage.setItem(EMAIL_KEY, mail.trim().toLowerCase())
      sessionStorage.setItem(REDIRECT_KEY, window.location.pathname + window.location.search)
    } catch {
      /* storage unavailable */
    }
  }

  const finishSignIn = async (fullName?: string, pendingTerms?: string | null) => {
    try {
      await ensureProfileWithRetry(ensureProfile, fullName)
    } catch {
      /* profile creation will be retried on next visit */
    }
    if (pendingTerms) {
      try {
        await acceptTerms({ version: pendingTerms })
        sessionStorage.removeItem(PENDING_TERMS_KEY)
      } catch {
        /* non-fatal */
      }
    }
  }

  const goRedirect = () => {
    onOpenChange(false)
    let target = '/'
    try {
      target = sessionStorage.getItem(REDIRECT_KEY) || '/'
      sessionStorage.removeItem(REDIRECT_KEY)
    } catch {
      /* ignore */
    }
    router.push(target)
    router.refresh()
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      storeContext(email)
      const result = await signIn('password', {
        email: email.trim().toLowerCase(),
        password,
        flow: 'signIn',
        redirectTo: '/auth/callback',
      })
      if (result.signingIn) {
        await finishSignIn()
        goRedirect()
      } else {
        setView({
          name: 'check',
          email: email.trim().toLowerCase(),
          message:
            'We emailed a verification link to your address. Check your inbox to finish signing in.',
        })
      }
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (!termsChecked) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      storeContext(email)
      sessionStorage.setItem(PENDING_TERMS_KEY, TERMS_VERSION)
      const result = await signIn('password', {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        flow: 'signUp',
        redirectTo: '/auth/callback',
      })
      if (result.signingIn) {
        await finishSignIn(name.trim(), TERMS_VERSION)
        goRedirect()
      } else {
        setView({
          name: 'check',
          email: email.trim().toLowerCase(),
          message:
            'Almost done — we emailed a verification link to your address. Click it to activate your account.',
        })
      }
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleMagicRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      storeContext(email)
      await signIn('email', { email: email.trim().toLowerCase(), redirectTo: '/auth/callback' })
      setView({
        name: 'check',
        email: email.trim().toLowerCase(),
        message: 'We emailed a sign-in link to your address. It expires in one hour.',
      })
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (view.name !== 'check') return
    setLoading(true)
    setError('')
    try {
      await signIn('email', { email: view.email, redirectTo: '/auth/callback' })
      setError('')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the code from your email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const mail = view.name === 'code' ? view.email : email.trim().toLowerCase()
      storeContext(mail)
      await redeemVerificationCode(signIn, mail, code.trim())
      const pendingTerms = sessionStorage.getItem(PENDING_TERMS_KEY)
      await finishSignIn(undefined, pendingTerms)
      goRedirect()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const switchTo = (next: View) => {
    setError('')
    setView(next)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset()
          onOpenChange(false)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-md">
            <Image
              src="/logo.png"
              alt=""
              width={794}
              height={672}
              style={{ height: '40px', width: 'auto' }}
              className="rounded-lg"
            />
            <div>
              <DialogTitle className="font-display">
                {view.name === 'signup' ? 'Create your account' : 'Welcome back'}
              </DialogTitle>
              <DialogDescription>
                {view.name === 'signup'
                  ? 'Join Event Nu to like, save, and share events.'
                  : 'Sign in to your Event Nu account.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-error/40 bg-error/10 px-md py-sm text-body-md text-error"
          >
            {error}
          </p>
        )}

        {view.name === 'signin' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-sm">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="flex flex-col items-center gap-sm text-body-md">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-primary hover:underline"
                onClick={() => switchTo({ name: 'magic' })}
              >
                <Mail className="h-4 w-4" /> Use a magic link instead
              </button>
              <p className="text-on-surface-variant">
                New to Event Nu?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => switchTo({ name: 'signup' })}
                >
                  Create an account
                </button>
              </p>
            </div>
          </form>
        )}

        {view.name === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="auth-name">Full name</Label>
              <Input
                id="auth-name"
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-sm">
              <Label htmlFor="auth-email-2">Email</Label>
              <Input
                id="auth-email-2"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-sm">
              <Label htmlFor="auth-password-2">Password</Label>
              <Input
                id="auth-password-2"
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <label className="flex items-start gap-sm text-body-md text-on-surface-variant">
              <Checkbox
                checked={termsChecked}
                onCheckedChange={(checked) => setTermsChecked(checked === true)}
                className="mt-0.5"
                aria-label="Accept terms and privacy policy"
              />
              <span>
                I agree to the{' '}
                <Link href={TERMS_URL} className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href={PRIVACY_POLICY_URL}
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => switchTo({ name: 'signin' })}
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {view.name === 'magic' && (
          <form onSubmit={handleMagicRequest} className="space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="auth-magic-email">Email</Label>
              <Input
                id="auth-magic-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Sending link…' : 'Email me a sign-in link'}
            </Button>
            <p className="text-center text-body-md text-on-surface-variant">
              Prefer password?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => switchTo({ name: 'signin' })}
              >
                Sign in with password
              </button>
            </p>
          </form>
        )}

        {view.name === 'check' && (
          <div className="space-y-md">
            <div className="flex items-start gap-sm rounded-xl border border-outline-variant bg-surface-container-high p-md">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-body-md text-on-surface-variant">{view.message}</p>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Didn&apos;t get it?{' '}
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                onClick={handleResend}
                disabled={loading}
              >
                Resend email
              </button>{' '}
              or{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => switchTo({ name: 'code', email: view.email })}
              >
                enter the code manually
              </button>
              .
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => switchTo({ name: 'signin' })}
            >
              Back to sign in
            </Button>
          </div>
        )}

        {view.name === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-md">
            <p className="text-body-md text-on-surface-variant">
              Enter the code we emailed to{' '}
              <span className="font-mono text-on-surface">{view.email}</span>.
            </p>
            <div className="space-y-sm">
              <Label htmlFor="auth-code">Verification code</Label>
              <Input
                id="auth-code"
                type="text"
                name="code"
                inputMode="text"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. 8AB2K9DX"
                className="font-mono tracking-[0.2em]"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Verifying…' : 'Verify and sign in'}
            </Button>
            <div className="flex items-center justify-between text-body-md">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => switchTo({ name: 'signin' })}
              >
                Back
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-primary hover:underline disabled:opacity-50"
                onClick={handleResend}
                disabled={loading}
              >
                <ShieldCheck className="h-4 w-4" /> Resend code
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
