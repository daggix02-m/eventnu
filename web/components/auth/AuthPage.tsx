'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, ArrowLeft, Mail, Calendar, Megaphone, Info, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldBox } from '@/components/ui/field-box'
import { Button } from '@/components/ui/button'
import { TERMS_VERSION, TERMS_URL, PRIVACY_POLICY_URL } from '@/lib/terms'
import { consumeAuthRedirect } from '@/lib/auth'
import {
  storeEmail,
  storePendingTerms,
  storePendingOrg,
  clearAllPending,
  type OrganizerKind,
} from '@/lib/auth-storage'

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

type AccountType = 'user' | 'organizer'

type View =
  | { name: 'choose' }
  | { name: 'signin' }
  | { name: 'signup'; step?: number }
  | { name: 'verify'; email: string }

type FieldErrors = Record<string, string>

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Invalid credentials') || msg.includes('InvalidAccountId')) {
      return 'Invalid email or password.'
    }
    if (msg.includes('TooManyFailedAttempts')) {
      return 'Too many attempts. Please try again later.'
    }
    const lower = msg.toLowerCase()
    if (lower.includes('password') && lower.includes('length')) {
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
    if (msg.includes('already exists')) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    return 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

/* -------------------------------------------------------------------------- */
/*  Password strength                                                           */
/* -------------------------------------------------------------------------- */

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-error' }
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-secondary' }
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-primary' }
  return { score: 4, label: 'Strong', color: 'bg-tertiary' }
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const { score, label, color } = getPasswordStrength(password)

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? color : 'bg-outline-variant/40'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Error summary (focusable for screen readers)                               */
/* -------------------------------------------------------------------------- */

function ErrorSummary({ fieldErrors, formError }: { fieldErrors: FieldErrors; formError: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const hasErrors = formError || Object.keys(fieldErrors).length > 0

  useEffect(() => {
    if (hasErrors) ref.current?.focus()
  }, [hasErrors])

  if (!hasErrors) return null

  const entries = Object.entries(fieldErrors).filter(([, v]) => v)

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="auth-error-heading"
      className="mb-3 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
    >
      <p id="auth-error-heading" className="font-semibold sr-only">
        There is a problem
      </p>
      {formError && <p>{formError}</p>}
      {entries.length > 0 && (
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {entries.map(([field, msg]) => (
            <li key={field}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Motion presets                                                              */
/* -------------------------------------------------------------------------- */

const fadeSlide = {
  initial: { opacity: 0, y: 12, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(2px)' },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
}

/* -------------------------------------------------------------------------- */
/*  Step progress indicator                                                     */
/* -------------------------------------------------------------------------- */

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-3 flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < current ? 'bg-primary' : 'bg-outline-variant/40'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-on-surface-variant">
        {current} of {total}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const acceptTerms = useMutation(api.profiles.acceptTerms)
  const createOrganizer = useMutation(api.organizers.create)

  /* ---- refs for auto-focus ---- */
  const emailRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  /* ---- state ---- */
  const [view, setView] = useState<View>(() =>
    searchParams.get('mode') === 'signin' ? { name: 'signin' } : { name: 'choose' },
  )
  const [accountType, setAccountType] = useState<AccountType>('user')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgKind, setOrgKind] = useState<OrganizerKind>('organizer')
  const [orgBio, setOrgBio] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgContactEmail, setOrgContactEmail] = useState('')
  const [orgLocation, setOrgLocation] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  /* ---- auto-focus first field on view change ---- */
  const signupStep = view.name === 'signup' ? view.step : undefined
  useEffect(() => {
    const timer = setTimeout(() => {
      if (view.name === 'signin') {
        emailRef.current?.focus()
      }
      if (view.name === 'signup' && (signupStep === 1 || !signupStep) && !name) {
        nameRef.current?.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [view.name, signupStep, name])

  /* ---- shared helpers ---- */

  const resetState = () => {
    setFormError('')
    setFieldErrors({})
  }

  const switchTo = (next: View) => {
    resetState()
    if (next.name === 'choose') {
      clearAllPending()
    }
    setView(next)
  }

  const finishSignIn = async (
    fullName?: string,
    accountTypeArg?: AccountType,
    orgNameArg?: string,
    pendingTerms?: string | null,
    orgDetails?: {
      kind?: OrganizerKind
      bio?: string
      website?: string
      contactEmail?: string
      location?: string
    },
  ) => {
    try {
      await ensureProfile({ fullName })
    } catch {
      /* retried on next visit */
    }
    if (accountTypeArg === 'organizer' && orgNameArg?.trim()) {
      try {
        await createOrganizer({
          organizerName: orgNameArg.trim(),
          kind: orgDetails?.kind,
          bio: orgDetails?.bio?.trim() || undefined,
          website: orgDetails?.website?.trim() || undefined,
          contactEmail: orgDetails?.contactEmail?.trim() || undefined,
          locationText: orgDetails?.location?.trim() || undefined,
        })
      } catch {
        /* retried on next visit */
      }
    }
    if (pendingTerms) {
      try {
        await acceptTerms({ version: pendingTerms })
        clearAllPending()
      } catch {
        /* non-fatal */
      }
    }
  }

  const goHome = () => {
    const target = consumeAuthRedirect('/')
    router.push(target)
    router.refresh()
  }

  /* ---- handlers ---- */

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: FieldErrors = {}
    if (!email.trim()) errs.email = 'Please enter your email.'
    if (!password) errs.password = 'Please enter a password.'
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setLoading(true)
    resetState()
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
        setView({ name: 'verify', email: email.trim().toLowerCase() })
      }
    } catch (err) {
      setFormError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: FieldErrors = {}
    if (!name.trim()) errs.name = 'Please enter your name.'
    if (accountType === 'organizer' && !orgName.trim()) {
      errs.orgName = 'Please enter your organizer or business name.'
    }
    if (!email.trim()) {
      errs.email = 'Please enter your email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!password) {
      errs.password = 'Please enter a password.'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }
    if (!termsChecked) {
      setFormError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setLoading(true)
    resetState()
    try {
      storeEmail(email)
      storePendingTerms(TERMS_VERSION)
      if (accountType === 'organizer') {
        storePendingOrg({
          accountType: 'organizer',
          orgName: orgName.trim(),
          orgKind,
          orgBio: orgBio.trim(),
          orgWebsite: orgWebsite.trim(),
          orgContactEmail: orgContactEmail.trim(),
          orgLocation: orgLocation.trim(),
        })
      } else {
        clearAllPending()
      }
      const result = await signIn('password', {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        flow: 'signUp',
        redirectTo: '/auth/callback',
      })
      if (result.signingIn) {
        await finishSignIn(name.trim(), accountType, orgName, TERMS_VERSION, {
          kind: orgKind,
          bio: orgBio,
          website: orgWebsite,
          contactEmail: orgContactEmail,
          location: orgLocation,
        })
        goHome()
      } else {
        setView({ name: 'verify', email: email.trim().toLowerCase() })
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        // The email already has a password account — route the user to sign in
        // instead of leaving them on a dead-end sign-up form.
        storeEmail(email)
        clearAllPending()
        switchTo({ name: 'signin' })
        setFormError('An account with this email already exists. Please sign in instead.')
      } else {
        setFormError(describeError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  /* ---- step-based signup for organizers ---- */
  const orgStep = view.name === 'signup' ? (view.step ?? 1) : 1
  const orgTotalSteps = accountType === 'organizer' ? 3 : 2

  const validateStep = (step: number): boolean => {
    const errs: FieldErrors = {}
    if (step === 1) {
      if (!name.trim()) errs.name = 'Please enter your name.'
      if (!email.trim()) errs.email = 'Please enter your email.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errs.email = 'Please enter a valid email address.'
    }
    if (step === 2) {
      if (!password) errs.password = 'Please enter a password.'
      else if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
      if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    }
    if (step === 3 && accountType === 'organizer') {
      if (!orgName.trim()) errs.orgName = 'Please enter your organizer or business name.'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (!validateStep(orgStep)) return
    resetState()
    setView({ name: 'signup', step: orgStep + 1 })
  }

  const prevStep = () => {
    resetState()
    setView({ name: 'signup', step: orgStep - 1 })
  }

  /* ---- dynamic shell copy ---- */

  const shellTitle =
    view.name === 'signup'
      ? accountType === 'organizer'
        ? 'Apply as an organizer'
        : 'Create your account'
      : view.name === 'signin'
        ? 'Welcome back'
        : view.name === 'verify'
          ? 'Check your email'
          : 'Join Event Nu'

  const shellDescription =
    view.name === 'signup'
      ? accountType === 'organizer'
        ? 'Create your organizer account. We\u2019ll review your application before you can publish events \u2014 usually within 1\u20132 business days.'
        : 'Start discovering and saving the events you love.'
      : view.name === 'signin'
        ? 'Sign in to your account.'
        : view.name === 'verify'
          ? `We sent a verification link to ${view.email}. Click it to finish.`
          : 'Your city\u2019s guide to what\u2019s happening. Pick how you want to get involved.'

  /* ---- render ---- */

  const subCardActions =
    view.name === 'signin' ? (
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => {
            if (email.trim()) storeEmail(email)
            router.push('/auth/forgot-password')
          }}
        >
          Forgot password?
        </button>
      </div>
    ) : null

  return (
    <AuthShell
      title={shellTitle}
      description={shellDescription}
      asideTitle="Make room for a good time."
      asideDescription="Discover the people, places, and events shaping the city this week."
      showTermsFooter={view.name !== 'signup'}
      subCardActions={subCardActions}
    >
      <AnimatePresence mode="wait">
        {/* ------------------------------------------------------------------ */}
        {/*  CHOOSE                                                             */}
        {/* ------------------------------------------------------------------ */}
        {view.name === 'choose' && (
          <motion.div key="choose" {...fadeSlide}>
            <ErrorSummary fieldErrors={fieldErrors} formError={formError} />

            <div className="grid gap-2 sm:grid-cols-2">
              <p className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant sm:col-span-2">
                I want to…
              </p>
              <button
                type="button"
                onClick={() => {
                  setAccountType('user')
                  resetState()
                  setView({ name: 'signup', step: 1 })
                }}
                className="group flex w-full items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-3 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/60 active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                  <Calendar className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-display font-semibold text-on-surface">
                    Browse events
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    Discover concerts, nightlife, and cultural events happening in Addis.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('organizer')
                  resetState()
                  setView({ name: 'signup', step: 1 })
                }}
                className="group flex w-full items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-high p-3 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-secondary/60 active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary transition-colors group-hover:bg-secondary/25">
                  <Megaphone className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-display font-semibold text-on-surface">
                    Host events
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    List your own events for the city. Organizer approval required before
                    publishing.
                  </span>
                </span>
              </button>
              <p className="text-center text-sm text-on-surface-variant sm:col-span-2">
                Already have an account?{' '}
                <button
                  type="button"
                  className="min-h-11 inline-block px-2 font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => switchTo({ name: 'signin' })}
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*  SIGN IN                                                            */}
        {/* ------------------------------------------------------------------ */}
        {view.name === 'signin' && (
          <motion.div key="signin" {...fadeSlide}>
            <ErrorSummary fieldErrors={fieldErrors} formError={formError} />

            <form onSubmit={handlePasswordSignIn} noValidate className="space-y-5">
              <FieldBox
                ref={emailRef}
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                invalid={!!fieldErrors.email}
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
                invalid={!!fieldErrors.password}
                required
              />
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Signing in\u2026' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-1 flex flex-col items-center gap-sm text-sm text-on-surface-variant">
              <button
                type="button"
                className="min-h-11 px-2 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => {
                  resetState()
                  setView({ name: 'choose' })
                }}
              >
                Create an account
              </button>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*  SIGN UP — Step-based                                               */}
        {/* ------------------------------------------------------------------ */}
        {view.name === 'signup' && (
          <motion.div key="signup" {...fadeSlide}>
            <ErrorSummary fieldErrors={fieldErrors} formError={formError} />

            <button
              type="button"
              className="mb-2 inline-flex min-h-11 items-center gap-1 px-1 text-sm text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => (orgStep === 1 ? switchTo({ name: 'choose' }) : prevStep())}
            >
              <ArrowLeft className="h-3.5 w-3.5" />{' '}
              {orgStep === 1 ? 'Choose a different path' : 'Back'}
            </button>

            {accountType === 'organizer' && (
              <StepProgress current={orgStep} total={orgTotalSteps} />
            )}

            {accountType === 'organizer' && orgStep === 1 && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 text-secondary" />
                <p className="text-xs text-on-surface-variant">
                  Your account is created right away. We&apos;ll review your application before you
                  can publish events — usually within 1–2 business days.
                </p>
              </div>
            )}

            <form onSubmit={handleSignUp} noValidate className="space-y-5">
              {/* ── Step 1: Personal info ── */}
              {orgStep === 1 && (
                <>
                  <FieldBox
                    ref={nameRef}
                    label={accountType === 'organizer' ? 'Your personal name' : 'Full name'}
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    invalid={!!fieldErrors.name}
                    required
                  />
                  <FieldBox
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    invalid={!!fieldErrors.email}
                    required
                  />
                </>
              )}

              {/* ── Step 2: Credentials ── */}
              {(orgStep === 2 || accountType === 'user') && (
                <>
                  <div className="space-y-1">
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
                      invalid={!!fieldErrors.password}
                      required
                    />
                    <PasswordStrength password={password} />
                  </div>
                  <FieldBox
                    label="Confirm password"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    invalid={!!fieldErrors.confirmPassword}
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
                      <Link
                        href={TERMS_URL}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href={PRIVACY_POLICY_URL}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </>
              )}

              {/* ── Step 3: Organizer details ── */}
              {orgStep === 3 && accountType === 'organizer' && (
                <>
                  <FieldBox
                    label="Organizer / business name"
                    type="text"
                    name="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Addis Nights"
                    invalid={!!fieldErrors.orgName}
                    required
                  />

                  <div className="space-y-1.5">
                    <p className="text-label-sm text-on-surface-variant">I am a…</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrgKind('organizer')}
                        className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background] ${
                          orgKind === 'organizer'
                            ? 'border-primary bg-primary/10'
                            : 'border-outline-variant bg-surface-container-high hover:border-primary/40'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            orgKind === 'organizer'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-primary/10 text-primary/60 group-hover:bg-primary/15'
                          }`}
                        >
                          <Megaphone className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-on-surface">
                            Organizer
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            Events &amp; experiences
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrgKind('venue')}
                        className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background] ${
                          orgKind === 'venue'
                            ? 'border-primary bg-primary/10'
                            : 'border-outline-variant bg-surface-container-high hover:border-primary/40'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            orgKind === 'venue'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-primary/10 text-primary/60 group-hover:bg-primary/15'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-on-surface">Venue</span>
                          <span className="text-xs text-on-surface-variant">
                            Spaces &amp; locations
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="org-bio" className="text-label-sm text-on-surface-variant">
                      Short bio
                    </label>
                    <textarea
                      id="org-bio"
                      value={orgBio}
                      onChange={(e) => setOrgBio(e.target.value)}
                      placeholder={
                        orgKind === 'venue'
                          ? 'Tell people about your space…'
                          : 'What kind of events do you host?'
                      }
                      rows={3}
                      maxLength={300}
                      className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-md py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus-visible:border-transparent"
                    />
                    <p className="text-right text-xs text-on-surface-variant">
                      {orgBio.length}/300
                    </p>
                  </div>

                  <FieldBox
                    label="City / location"
                    type="text"
                    name="orgLocation"
                    value={orgLocation}
                    onChange={(e) => setOrgLocation(e.target.value)}
                    placeholder="e.g. Addis Ababa, Bole"
                    required
                  />

                  <FieldBox
                    label="Contact email"
                    type="email"
                    name="orgContactEmail"
                    autoComplete="email"
                    value={orgContactEmail || email}
                    onChange={(e) => setOrgContactEmail(e.target.value)}
                    onBlur={() => {
                      if (!orgContactEmail && email) setOrgContactEmail(email)
                    }}
                    placeholder="you@example.com"
                    required
                  />

                  <FieldBox
                    label="Website (optional)"
                    type="url"
                    name="orgWebsite"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </>
              )}

              {/* ── Navigation / Submit ── */}
              {accountType === 'organizer' && orgStep < orgTotalSteps ? (
                <Button type="button" className="h-11 w-full rounded-xl" onClick={nextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading
                    ? accountType === 'organizer'
                      ? 'Submitting application\u2026'
                      : 'Creating account\u2026'
                    : accountType === 'organizer'
                      ? 'Submit application'
                      : 'Create account'}
                </Button>
              )}
            </form>

            <div className="mt-3 text-center text-sm text-on-surface-variant">
              Already have an account?{' '}
              <button
                type="button"
                className="min-h-11 inline-block px-2 font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => switchTo({ name: 'signin' })}
              >
                Sign in
              </button>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*  VERIFY — check your email                                          */}
        {/* ------------------------------------------------------------------ */}
        {view.name === 'verify' && (
          <motion.div key="verify" {...fadeSlide}>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-on-surface-variant">
                Click the link in the email to finish signing in. The link expires in one hour.
              </p>
              <Button
                variant="outline"
                className="mt-1"
                onClick={() => switchTo({ name: 'signin' })}
              >
                Back to sign in
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
