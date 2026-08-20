'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/Container'
import { CodeInput } from '@/components/auth/CodeInput'
import { consumeAuthRedirect, redeemVerificationCode } from '@/lib/auth'
import {
  getEmail,
  getPendingOrg,
  getPendingTerms,
  clearPendingTerms,
  clearPendingOrg,
} from '@/lib/auth-storage'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const acceptTerms = useMutation(api.profiles.acceptTerms)
  const createOrganizer = useMutation(api.organizers.create)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')

  const complete = useCallback(
    async (mail: string, verificationCode: string) => {
      setStatus('loading')
      setError('')
      try {
        await redeemVerificationCode(signIn, mail, verificationCode)
        try {
          const pending = getPendingOrg()
          await ensureProfile({})
          if (pending?.accountType === 'organizer' && pending.orgName.trim()) {
            try {
              await createOrganizer({
                organizerName: pending.orgName.trim(),
                kind: pending.orgKind ?? undefined,
                bio: pending.orgBio || undefined,
                website: pending.orgWebsite || undefined,
                contactEmail: pending.orgContactEmail || undefined,
                locationText: pending.orgLocation || undefined,
              })
            } catch {
              /* organizer profile creation retried on next visit */
            }
          }
          clearPendingOrg()
        } catch {
          /* retried on next visit */
        }
        const pendingTerms = getPendingTerms()
        if (pendingTerms) {
          try {
            await acceptTerms({ version: pendingTerms })
            clearPendingTerms()
          } catch {
            /* non-fatal */
          }
        }
        const target = consumeAuthRedirect('/')
        router.replace(target)
        router.refresh()
      } catch (err) {
        setStatus('error')
        setError(
          err instanceof Error
            ? err.message.includes('expired') ||
              err.message.includes('Invalid') ||
              err.message.includes('verifier')
              ? 'This link is invalid or has expired. Please request a new one.'
              : err.message
            : 'Could not sign in. Please try again.',
        )
      }
    },
    [router, signIn, ensureProfile, acceptTerms, createOrganizer],
  )

  useEffect(() => {
    const urlCode = searchParams.get('code')
    const mail = getEmail() || ''

    if (urlCode) {
      if (mail) {
        complete(mail, urlCode)
      } else {
        setEmail('')
        setCode(urlCode)
        setStatus('idle')
      }
    } else {
      setStatus('idle')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !code.trim()) {
      setError('Please enter both your email and the code from the email.')
      return
    }
    complete(email.trim().toLowerCase(), code.trim())
  }

  return (
    <Container className="py-xl flex justify-center">
      <div className="w-full max-w-[28rem] space-y-md">
        <h1 className="font-display text-headline-md text-on-surface">Finishing sign in…</h1>

        {status === 'loading' && (
          <div className="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-body-md text-on-surface-variant">
              Verifying your link and signing you in.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-md rounded-xl border border-error/40 bg-error/10 p-lg">
            <p role="alert" className="text-body-md text-error">
              {error}
            </p>
            <p className="text-body-md text-on-surface-variant">
              Request a new sign-in link from the sign-in form and try again.
            </p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to home
            </Button>
          </div>
        )}

        {status === 'idle' && (
          <form
            onSubmit={handleManualSubmit}
            noValidate
            className="space-y-md rounded-xl border border-outline-variant bg-surface-container-low p-lg"
          >
            <p className="text-body-md text-on-surface-variant">
              Your email wasn&apos;t saved in this browser. Enter the email you used and the code
              from the email to sign in.
            </p>
            <div className="space-y-sm">
              <Label htmlFor="cb-email">Email</Label>
              <Input
                id="cb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-sm">
              <Label>Code</Label>
              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={(c) => {
                  if (email.trim()) {
                    complete(email.trim().toLowerCase(), c)
                  }
                }}
                error={!!error}
              />
            </div>
            {error && <p className="text-body-md text-error">{error}</p>}
            <Button type="submit" className="h-11 w-full">
              Verify and sign in
            </Button>
          </form>
        )}
      </div>
    </Container>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-xl flex justify-center">
          <div className="flex items-center gap-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-body-md text-on-surface-variant">Loading…</p>
          </div>
        </Container>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
