'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ExternalLink, Mail, Users } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '../../lib/utils'

const reservationSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  message: z.string().max(300, 'Keep it under 300 characters').optional(),
})
type ReservationForm = z.infer<typeof reservationSchema>

export interface EventCTAEvent {
  id: string
  is_free: boolean
  price_display: string | null
  action_type: 'open_entry' | 'reservation' | 'external_link' | 'contact'
  external_link: string | null
  external_link_label: string | null
  contact_email: string | null
  reservation_limit: number | null
  start_date?: string
}

export interface UseEventCTAOptions {
  event: EventCTAEvent
  currentUser: { id: string; email: string; full_name: string } | null
  isGuest: boolean
  onGuestAction: () => void
  supabase: any
}

const footerBtnBase =
  'w-full h-12 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2'

export function useEventCTA({
  event,
  currentUser,
  isGuest,
  onGuestAction,
  supabase,
}: UseEventCTAOptions) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
    useForm<ReservationForm>({
      resolver: zodResolver(reservationSchema),
      defaultValues: {
        name: currentUser?.full_name ?? '',
        email: currentUser?.email ?? '',
      },
    })

  useEffect(() => {
    reset({
      name: currentUser?.full_name ?? '',
      email: currentUser?.email ?? '',
    })
  }, [currentUser?.full_name, currentUser?.email, reset])

  useEffect(() => {
    async function load() {
      if (event.action_type !== 'reservation') return

      if (currentUser) {
        const { data } = await supabase
          .from('reservation_requests')
          .select('id')
          .eq('event_id', event.id)
          .eq('user_id', currentUser.id)
          .maybeSingle()
        if (data) setSubmitted(true)
      }

      if (event.reservation_limit) {
        const { count } = await supabase
          .from('reservation_requests')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
        if (count !== null) {
          setSpotsLeft(Math.max(0, event.reservation_limit - count))
        }
      }
    }
    load()
  }, [event.id, event.action_type, event.reservation_limit, currentUser?.id, supabase])

  async function onSubmitReservation(data: ReservationForm) {
    setSubmitError('')
    const { error } = await supabase.from('reservation_requests').insert({
      event_id: event.id,
      user_id: currentUser?.id ?? null,
      name: data.name,
      email: data.email,
      message: data.message ?? '',
      status: 'pending',
    })
    if (error) {
      setSubmitError('Something went wrong. Please try again.')
      return
    }
    setSubmitted(true)
    setSheetOpen(false)
    if (spotsLeft !== null) setSpotsLeft(s => (s !== null ? Math.max(0, s - 1) : null))
  }

  const isPast = event.start_date ? new Date(event.start_date) < new Date() : false
  const isFull = spotsLeft !== null && spotsLeft === 0

  const statusBlock = useMemo(() => {
    if (isPast || event.action_type !== 'reservation' || submitted) return null
    if (spotsLeft !== null) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit',
            spotsLeft <= 5
              ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400'
              : 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400'
          )}
        >
          <Users size={11} />
          {isFull ? 'Fully booked' : `${spotsLeft} spots left`}
        </span>
      )
    }
    return null
  }, [isPast, event.action_type, submitted, spotsLeft, isFull])

  const footerAction = useMemo(() => {
    if (isPast) {
      return (
        <div
          className={cn(
            footerBtnBase,
            'bg-muted text-muted-foreground cursor-not-allowed border border-border'
          )}
        >
          Event Ended
        </div>
      )
    }

    if (event.action_type === 'open_entry') {
      return (
        <div
          className={cn(
            footerBtnBase,
            'bg-muted/80 text-foreground border border-border cursor-default'
          )}
        >
          Just Show Up
        </div>
      )
    }

    if (event.action_type === 'reservation') {
      if (submitted) {
        return (
          <div
            className={cn(
              footerBtnBase,
              'bg-green-600/90 text-white cursor-default'
            )}
          >
            <CheckCircle size={16} />
            Request Sent
          </div>
        )
      }
      return (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={isFull}
          onClick={() => (isGuest ? onGuestAction() : setSheetOpen(true))}
          className={cn(
            footerBtnBase,
            isFull
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-white cursor-pointer'
          )}
        >
          {isFull ? 'Fully Booked' : 'Reserve a Spot'}
        </motion.button>
      )
    }

    if (event.action_type === 'external_link' && event.external_link) {
      return (
        <a
          href={event.external_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => {
            if (isGuest) {
              e.preventDefault()
              onGuestAction()
            }
          }}
          className={cn(footerBtnBase, 'bg-primary hover:bg-primary/90 text-white')}
        >
          {event.external_link_label || 'Get Tickets'}
          <ExternalLink size={16} />
        </a>
      )
    }

    if (event.action_type === 'contact' && event.contact_email) {
      return (
        <a
          href={`mailto:${event.contact_email}`}
          className={cn(footerBtnBase, 'bg-primary hover:bg-primary/90 text-white')}
        >
          Contact Organizer
          <Mail size={16} />
        </a>
      )
    }

    return null
  }, [
    isPast,
    event,
    submitted,
    isFull,
    isGuest,
    onGuestAction,
    setSheetOpen,
  ])

  const reservationSheet = event.action_type === 'reservation' && !isPast && (
    <AnimatePresence>
      {sheetOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheetOpen(false)}
            className="fixed inset-0 bg-black/40 z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-background
                       rounded-t-3xl shadow-2xl px-4 pb-8 pt-5 max-h-[90vh] overflow-y-auto
                       border-t border-border"
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-foreground mb-1">Reserve a Spot</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Fill in your details and the organizer will confirm your reservation.
            </p>

            <form onSubmit={handleSubmit(onSubmitReservation)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Full Name *
                </label>
                <input
                  {...register('name')}
                  placeholder="Your full name"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl border text-sm bg-background text-foreground outline-none',
                    'focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all',
                    errors.name ? 'border-red-400' : 'border-border'
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="your@email.com"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl border text-sm bg-background text-foreground outline-none',
                    'focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all',
                    errors.email ? 'border-red-400' : 'border-border'
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Message
                  <span className="text-muted-foreground normal-case font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <textarea
                  {...register('message')}
                  placeholder="Anything you want the organizer to know…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-background text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                />
              </div>

              {submitError && (
                <p className="text-sm text-red-500 text-center">{submitError}</p>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  footerBtnBase,
                  'bg-primary hover:bg-primary/90 text-white disabled:opacity-60'
                )}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return {
    isPast,
    statusBlock,
    footerAction,
    reservationSheet,
  }
}

/** @deprecated Use useEventCTA + footerAction / statusBlock for split layout */
export interface EventCTAProps extends UseEventCTAOptions {
  surface?: 'full' | 'footer' | 'status'
}

export function EventCTA({ surface = 'full', ...options }: EventCTAProps) {
  const { statusBlock, footerAction, reservationSheet } = useEventCTA(options)

  if (surface === 'status') return <>{statusBlock}</>
  if (surface === 'footer') {
    return (
      <>
        {footerAction}
        {reservationSheet}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {statusBlock}
      {footerAction}
      {reservationSheet}
    </div>
  )
}
