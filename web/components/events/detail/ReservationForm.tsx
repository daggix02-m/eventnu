'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Event } from '@/types'

interface ReservationFormProps {
  event: Event
}

const inputClass =
  'w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'

export function ReservationForm({ event }: ReservationFormProps) {
  const createReservation = useMutation(api.reservations.create)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const remaining =
    event.reservation_enabled && event.reservation_limit != null && event.reservation_count != null
      ? Math.max(0, event.reservation_limit - event.reservation_count)
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setStatus('error')
      setError('Please provide your name and email.')
      return
    }
    setStatus('pending')
    setError('')
    try {
      await createReservation({
        eventId: event.id as Id<'events'>,
        name: name.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
      })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      if (err instanceof Error) {
        const msg = err.message
        if (msg.includes('Reservation limit reached')) {
          setError('This event has reached its reservation limit. No more spots are available.')
        } else if (msg.includes('Event not found')) {
          setError('This event is no longer available.')
        } else if (msg.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.')
        } else {
          setError(msg || 'Could not submit your reservation. Please try again.')
        }
      } else {
        setError('Could not submit your reservation. Please try again.')
      }
    }
  }

  if (status === 'done') {
    return (
      <div className="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/60 shadow-xl shadow-black/30 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-on-surface">
              Reservation Confirmed!
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">
              Spot reserved for {name || 'you'}
            </p>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          We&apos;ve recorded your spot for{' '}
          <strong className="text-on-surface">{event.title}</strong>. Watch your inbox at{' '}
          <strong className="text-on-surface">{email}</strong> for updates and check-in info.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/60 shadow-xl shadow-black/30 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-on-surface">Reserve Your Spot</h3>
            <p className="text-xs text-on-surface-variant">Instant booking request</p>
          </div>
        </div>
        {remaining != null && (
          <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-mono text-[11px] font-bold">
            {remaining} spots left
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label
            htmlFor={`res-name-${event.id}`}
            className="block text-xs font-mono text-on-surface-variant mb-1 uppercase tracking-wider"
          >
            Full Name
          </label>
          <input
            id={`res-name-${event.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Abebe Bikila"
            required
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor={`res-email-${event.id}`}
            className="block text-xs font-mono text-on-surface-variant mb-1 uppercase tracking-wider"
          >
            Email Address
          </label>
          <input
            id={`res-email-${event.id}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. abebe@example.com"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor={`res-msg-${event.id}`}
            className="block text-xs font-mono text-on-surface-variant mb-1 uppercase tracking-wider"
          >
            Note to Host (optional)
          </label>
          <textarea
            id={`res-msg-${event.id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any special requests or questions..."
            rows={2}
            className={inputClass}
          />
        </div>

        {status === 'error' && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full font-bold text-sm rounded-xl"
          disabled={status === 'pending'}
        >
          {status === 'pending' ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-pulse" /> Reservation Pending...
            </>
          ) : (
            'Confirm Reservation'
          )}
        </Button>
      </form>
    </div>
  )
}
