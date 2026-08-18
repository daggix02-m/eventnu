'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2, Mail, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsContent,
} from '@/components/ui/animated-tabs'
import { useMeasure } from '@/lib/use-measure'
import { Button } from '@/components/ui/button'
import { FieldBox } from '@/components/ui/field-box'

const EMAIL_KEY = 'eventnu_auth_email'
const REDIRECT_KEY = 'eventnu_auth_redirect'

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Invalid credentials') || msg.includes('InvalidAccountId')) {
      return 'Invalid email or password.'
    }
    if (msg.includes('TooManyFailedAttempts')) {
      return 'Too many attempts. Please try again later.'
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

type Step = 'signin' | 'sent'

export function SignInDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { signIn } = useAuthActions()
  const ensureProfile = useMutation(api.profiles.ensureProfile)

  const [step, setStep] = React.useState<Step>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [ref, bounds] = useMeasure<HTMLDivElement>()

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setStep('signin')
        setEmail('')
        setPassword('')
        setLoading(false)
        setError('')
      }, 300)
    }
    onOpenChange(v)
  }

  const storeContext = (mail: string) => {
    try {
      sessionStorage.setItem(EMAIL_KEY, mail.trim().toLowerCase())
      sessionStorage.setItem(REDIRECT_KEY, window.location.pathname + window.location.search)
    } catch {
      /* storage unavailable */
    }
  }

  const finishSignIn = async () => {
    try {
      await ensureProfile({})
    } catch {
      /* profile creation retried on next visit */
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
        setStep('sent')
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
      setStep('sent')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      await signIn('email', { email: email.trim().toLowerCase(), redirectTo: '/auth/callback' })
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerClose className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-transform active:scale-75">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DrawerClose>

        <div className="relative overflow-hidden px-6 pt-5 text-center">
          <div className="aurora-bg absolute inset-0 opacity-40" aria-hidden="true" />
          <span className="relative select-none font-display text-headline-md font-bold text-on-surface">
            {step === 'signin' ? 'Welcome back' : 'Check your email'}
          </span>
        </div>

        <DrawerTitle className="sr-only">Sign in</DrawerTitle>
        <DrawerDescription className="sr-only">Sign in to your Event Nu account</DrawerDescription>

        <motion.div
          animate={{
            height: bounds.height > 0 ? bounds.height : step === 'signin' ? 360 : 240,
          }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="overflow-hidden"
        >
          <div ref={ref} className="px-6 pb-6 pt-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {step === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                >
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

                    <AnimatedTabsContent value="email" className="pt-6 pb-2">
                      <form onSubmit={handlePasswordSignIn} className="space-y-4">
                        <FieldBox
                          label="Email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-12"
                          required
                        />
                        <FieldBox
                          label="Password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-12"
                          showPasswordToggle
                          required
                        />
                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl"
                          disabled={loading}
                        >
                          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                      </form>
                    </AnimatedTabsContent>

                    <AnimatedTabsContent value="magic" className="pt-6 pb-2">
                      <form onSubmit={handleMagicRequest} className="space-y-4">
                        <FieldBox
                          label="Email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-12"
                          required
                        />
                        <Button
                          type="submit"
                          className="h-12 w-full rounded-2xl"
                          disabled={loading}
                        >
                          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {loading ? 'Sending link…' : 'Email me a sign-in link'}
                        </Button>
                      </form>
                    </AnimatedTabsContent>
                  </AnimatedTabs>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border border-error/40 bg-error/10 px-md py-sm text-body-md text-error"
                    >
                      {error}
                    </p>
                  )}

                  <div className="mt-5 space-y-2 text-center text-body-md">
                    <p className="text-on-surface-variant">
                      New to Event Nu?{' '}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => {
                          onOpenChange(false)
                          router.push('/auth')
                        }}
                      >
                        Create an account
                      </button>
                    </p>
                    <p className="text-on-surface-variant">
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          onOpenChange(false)
                          router.push('/auth')
                        }}
                      >
                        Applying as an organizer?
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-sm rounded-xl border border-outline-variant bg-surface-container-high p-md">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-body-md text-on-surface-variant">
                      We emailed a sign-in link to{' '}
                      <span className="font-mono text-on-surface">
                        {email.trim().toLowerCase()}
                      </span>
                      . It expires in one hour.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-body-md">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {
                        setStep('signin')
                        setError('')
                      }}
                    >
                      Back to sign in
                    </button>
                    <button
                      type="button"
                      className="text-primary hover:underline disabled:opacity-50"
                      onClick={handleResend}
                      disabled={loading}
                    >
                      {loading ? 'Sending…' : 'Resend email'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  )
}

export default SignInDrawer
