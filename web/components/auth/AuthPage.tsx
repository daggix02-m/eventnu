'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, Mail, ShieldCheck, Compass, Megaphone, ArrowLeft } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TERMS_VERSION, TERMS_URL, PRIVACY_POLICY_URL } from '@/lib/terms'
import { redeemVerificationCode } from '@/lib/auth'

const EMAIL_KEY = 'eventnu_auth_email'
const PENDING_TERMS_KEY = 'eventnu_pending_terms'
const PENDING_ACCOUNT_KEY = 'eventnu_pending_account_type'
const PENDING_ORG_NAME_KEY = 'eventnu_pending_org_name'

type AccountType = 'user' | 'organizer'

type View =
  | { name: 'choose' }
  | { name: 'signin' }
  | { name: 'signup' }
  | { name: 'magic' }
  | { name: 'check'; email: string; message: string }
  | { name: 'code'; email: string }

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

export function AuthPage() {
  const router = useRouter()
  const { signIn } = useAuthActions()
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const acceptTerms = useMutation(api.profiles.acceptTerms)
  const createOrganizer = useMutation(api.organizers.create)

  const [view, setView] = useState<View>({ name: 'choose' })
  const [accountType, setAccountType] = useState<AccountType>('user')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const storeEmail = (mail: string) => {
    try {
      sessionStorage.setItem(EMAIL_KEY, mail.trim().toLowerCase())
    } catch {
      /* storage unavailable */
    }
  }

  const finishSignIn = async (
    fullName?: string,
    accountTypeArg?: AccountType,
    orgNameArg?: string,
    pendingTerms?: string | null,
  ) => {
    try {
      await ensureProfile({ fullName, accountType: accountTypeArg })
    } catch {
      /* profile creation retried on next visit */
    }
    if (accountTypeArg === 'organizer' && orgNameArg?.trim()) {
      try {
        await createOrganizer({ organizerName: orgNameArg.trim() })
      } catch {
        /* organizer profile creation retried on next visit */
      }
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

  const goHome = () => {
    router.push('/')
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
      storeEmail(email)
      const result = await signIn('password', {
        email: email.trim().toLowerCase(),
        password,
        flow: 'signIn',
        redirectTo: '/auth/callback',
      })
      if (result.signingIn) {
        await finishSignIn()
        goHome()
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
    if (accountType === 'organizer' && !orgName.trim()) {
      setError('Please enter your organizer or business name.')
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
      storeEmail(email)
      sessionStorage.setItem(PENDING_TERMS_KEY, TERMS_VERSION)
      if (accountType === 'organizer') {
        sessionStorage.setItem(PENDING_ACCOUNT_KEY, 'organizer')
        sessionStorage.setItem(PENDING_ORG_NAME_KEY, orgName.trim())
      } else {
        sessionStorage.removeItem(PENDING_ACCOUNT_KEY)
        sessionStorage.removeItem(PENDING_ORG_NAME_KEY)
      }
      const result = await signIn('password', {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        flow: 'signUp',
        redirectTo: '/auth/callback',
      })
      if (result.signingIn) {
        await finishSignIn(name.trim(), accountType, orgName, TERMS_VERSION)
        goHome()
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
      storeEmail(email)
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
      storeEmail(mail)
      await redeemVerificationCode(signIn, mail, code.trim())
      const pendingTerms = sessionStorage.getItem(PENDING_TERMS_KEY)
      const pendingAccount =
        (sessionStorage.getItem(PENDING_ACCOUNT_KEY) as AccountType | null) ?? 'user'
      const pendingOrgName = sessionStorage.getItem(PENDING_ORG_NAME_KEY) ?? ''
      await finishSignIn(undefined, pendingAccount, pendingOrgName, pendingTerms)
      sessionStorage.removeItem(PENDING_ACCOUNT_KEY)
      sessionStorage.removeItem(PENDING_ORG_NAME_KEY)
      goHome()
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

  const chooseAccount = (type: AccountType) => {
    setAccountType(type)
    setError('')
    setView({ name: 'signup' })
  }

  return (
    <Container className="py-lg">
      <div className="mx-auto w-full max-w-[28rem]">
        <header className="mb-6 text-center">
          <h1 className="font-display text-display-md text-on-surface">
            {view.name === 'signup'
              ? 'Create your account'
              : view.name === 'choose'
                ? 'Join Event Nu'
                : 'Welcome back'}
          </h1>
          <p className="mt-1 font-body-md text-on-surface-variant">
            {view.name === 'signup'
              ? accountType === 'organizer'
                ? 'List and promote your events across Addis.'
                : 'Like, save, and share the events you love.'
              : view.name === 'choose'
                ? 'One account for discovering — or listing — the city.'
                : 'Sign in to continue.'}
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-error/40 bg-error/10 px-md py-sm text-body-md text-error"
          >
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6">
          {view.name === 'choose' && (
            <div className="space-y-md">
              <p className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                I want to…
              </p>
              <button
                type="button"
                onClick={() => chooseAccount('user')}
                className="flex w-full items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-4 text-left transition-colors hover:border-primary/60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Compass className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display font-semibold text-on-surface">
                    Find events
                  </span>
                  <span className="text-body-md text-on-surface-variant">
                    Attend as a guest — like, save, and share.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => chooseAccount('organizer')}
                className="flex w-full items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-4 text-left transition-colors hover:border-primary/60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <Megaphone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display font-semibold text-on-surface">
                    List events
                  </span>
                  <span className="text-body-md text-on-surface-variant">
                    Create an organizer profile for your business.
                  </span>
                </span>
              </button>
              <p className="text-center text-body-md text-on-surface-variant">
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => switchTo({ name: 'signin' })}
                >
                  Sign in
                </button>
              </p>
            </div>
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
                    onClick={() => switchTo({ name: 'choose' })}
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
              {accountType === 'organizer' && (
                <div className="space-y-sm">
                  <Label htmlFor="auth-org-name">Organizer / business name</Label>
                  <Input
                    id="auth-org-name"
                    type="text"
                    name="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Addis Nights"
                    required
                  />
                </div>
              )}
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
                  className="text-primary hover:underline"
                  onClick={() => switchTo({ name: 'code', email: view.email })}
                >
                  Enter the code manually
                </button>
                .
              </p>
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
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => switchTo({ name: 'signin' })}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-primary hover:underline disabled:opacity-50"
                  onClick={() => switchTo({ name: 'magic' })}
                  disabled={loading}
                >
                  <ShieldCheck className="h-4 w-4" /> Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Container>
  )
}
