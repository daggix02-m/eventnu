'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, Mail, ShieldCheck, Compass, Megaphone, ArrowLeft, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsContent,
} from '@/components/ui/animated-tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldBox } from '@/components/ui/field-box'
import { Button } from '@/components/ui/button'
import { TERMS_VERSION, TERMS_URL, PRIVACY_POLICY_URL } from '@/lib/terms'
import { redeemVerificationCode } from '@/lib/auth'

const EMAIL_KEY = 'eventnu_auth_email'
const REDIRECT_KEY = 'eventnu_auth_redirect'
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
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
    let target = '/'
    try {
      target = sessionStorage.getItem(REDIRECT_KEY) || '/'
      sessionStorage.removeItem(REDIRECT_KEY)
    } catch {
      /* storage unavailable */
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
    <AuthShell
      title={
        view.name === 'signup'
          ? accountType === 'organizer'
            ? 'Apply as an organizer'
            : 'Create your account'
          : view.name === 'choose'
            ? 'Join Event Nu'
            : 'Welcome back'
      }
      description={
        view.name === 'signup'
          ? accountType === 'organizer'
            ? 'Create your account, then submit your organizer details for review.'
            : 'Like, save, and share the events you love.'
          : view.name === 'choose'
            ? 'Choose how you want to use Event Nu.'
            : 'Sign in to continue.'
      }
      asideTitle="Make room for a good night."
      asideDescription="Discover the people, places, and events shaping the city this week."
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-error/40 bg-error/10 px-md py-sm text-body-md text-error"
        >
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        {view.name === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid gap-sm sm:grid-cols-2">
              <p className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant sm:col-span-2">
                I want to…
              </p>
              <button
                type="button"
                onClick={() => chooseAccount('user')}
                className="flex w-full items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-4 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/60"
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
                className="flex w-full items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-4 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <Megaphone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display font-semibold text-on-surface">
                    List events
                  </span>
                  <span className="text-body-md text-on-surface-variant">
                    Apply to list and promote your events. Approval is required before publishing.
                  </span>
                </span>
              </button>
              <p className="text-center text-body-md text-on-surface-variant sm:col-span-2">
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
          </motion.div>
        )}

        {view.name === 'signin' && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high text-body-md font-medium text-on-surface opacity-60 cursor-not-allowed"
              >
                <GoogleIcon className="h-5 w-5" />
                Continue with Google
              </button>
              <button
                type="button"
                disabled
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high text-body-md font-medium text-on-surface opacity-60 cursor-not-allowed"
              >
                <GitHubIcon className="h-5 w-5" />
                Continue with GitHub
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center text-label-sm">
                <span className="bg-surface-container-low px-3 text-on-surface-variant">
                  or continue with email
                </span>
              </div>
            </div>

            <AnimatedTabs defaultValue="email">
              <AnimatedTabsList>
                <AnimatedTabsTrigger value="email">
                  <Mail className="h-4 w-4" />
                  Email
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger value="magic">
                  <Sparkles className="h-4 w-4" />
                  Magic link
                </AnimatedTabsTrigger>
              </AnimatedTabsList>
              <AnimatedTabsContent value="email" className="pt-4">
                <form onSubmit={handlePasswordSignIn} className="space-y-md">
                  <FieldBox
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <FieldBox
                    label="Password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    showPasswordToggle
                    required
                  />
                  <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Signing in…' : 'Sign in'}
                  </Button>
                  <p className="text-center text-on-surface-variant">
                    New to Event Nu?{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => switchTo({ name: 'choose' })}
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              </AnimatedTabsContent>
              <AnimatedTabsContent value="magic" className="pt-4">
                <form onSubmit={handleMagicRequest} className="space-y-md">
                  <FieldBox
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Sending link…' : 'Email me a sign-in link'}
                  </Button>
                  <p className="text-center text-on-surface-variant">
                    We&apos;ll email you a one-time sign-in link that expires in one hour.
                  </p>
                </form>
              </AnimatedTabsContent>
            </AnimatedTabs>
          </motion.div>
        )}

        {view.name === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="mb-md inline-flex items-center gap-1 text-body-md text-primary hover:underline"
              onClick={() => switchTo({ name: 'choose' })}
            >
              <ArrowLeft className="h-4 w-4" /> Choose a different path
            </button>
            {accountType === 'organizer' && (
              <div className="mb-md rounded-xl border border-secondary/30 bg-secondary/10 p-md">
                <p className="font-mono text-label-sm uppercase tracking-wider text-secondary">
                  Organizer application
                </p>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Your account is created right away. Event Nu will review your organizer details
                  before you can publish events.
                </p>
              </div>
            )}
            <form onSubmit={handleSignUp} className="space-y-md">
              <FieldBox
                label="Full name"
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
              {accountType === 'organizer' && (
                <FieldBox
                  label="Organizer / business name"
                  type="text"
                  name="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Addis Nights"
                  required
                />
              )}
              <FieldBox
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <FieldBox
                label="Password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                showPasswordToggle
                minLength={8}
                required
              />
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
              <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading
                  ? accountType === 'organizer'
                    ? 'Submitting application…'
                    : 'Creating account…'
                  : accountType === 'organizer'
                    ? 'Submit application'
                    : 'Create account'}
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
          </motion.div>
        )}

        {view.name === 'check' && (
          <motion.div
            key="check"
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-md"
          >
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
          </motion.div>
        )}

        {view.name === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleCodeSubmit} className="space-y-md">
              <p className="text-body-md text-on-surface-variant">
                Enter the code we emailed to{' '}
                <span className="font-mono text-on-surface">{view.email}</span>.
              </p>
              <FieldBox
                label="Verification code"
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
              <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
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
                  onClick={() => switchTo({ name: 'signin' })}
                  disabled={loading}
                >
                  <ShieldCheck className="h-4 w-4" /> Resend code
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
