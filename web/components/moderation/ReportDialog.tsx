'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '@eventnu/convex/_generated/api'
import { Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'

const reasons = [
  ['fraud_or_scam', 'Fraud or scam'],
  ['illegal_activity', 'Illegal activity'],
  ['unsafe_venue_or_event', 'Unsafe venue or event'],
  ['misleading_information', 'Misleading information'],
  ['harassment_or_discrimination', 'Harassment or discrimination'],
  ['copyright_or_intellectual_property', 'Copyright or intellectual property'],
  ['other', 'Other'],
] as const

type TargetType = 'event' | 'organizer' | 'story'

export function ReportDialog({
  targetType,
  targetId,
}: {
  targetType: TargetType
  targetId: string
}) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const submit = useMutation(api.reports.submit)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<(typeof reasons)[number][0]>('other')
  const [details, setDetails] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleOpen = () => {
    if (!isAuthenticated) {
      openAuth()
      return
    }
    setMessage(null)
    setOpen(true)
  }

  const handleSubmit = async () => {
    setPending(true)
    setMessage(null)
    try {
      await submit({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      })
      setMessage('Report submitted for review.')
      setDetails('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit report.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md transition-colors hover:border-error/60 hover:text-white"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" /> Report
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Report{' '}
              {targetType === 'event'
                ? 'this event'
                : targetType === 'story'
                  ? 'this story'
                  : 'this organizer'}
            </DialogTitle>
            <DialogDescription>
              Tell us what regulatory or community standard may have been violated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-on-surface" htmlFor="report-reason">
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as (typeof reasons)[number][0])}
              className="w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-base text-on-surface"
            >
              {reasons.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="block text-sm font-semibold text-on-surface" htmlFor="report-details">
              Details <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-base text-on-surface"
              placeholder="Add context that can help our review."
            />
            {message && (
              <p className="text-sm text-on-surface-variant" role="status">
                {message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
