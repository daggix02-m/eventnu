import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { internal } from './_generated/api'
import { getUserProfile, requireAdmin } from './helpers'
import { rateLimiter } from './rateLimiter'

export const getByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query('reservationRequests')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .take(100)
  },
})

export const create = mutation({
  args: {
    eventId: v.id('events'),
    name: v.string(),
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim()
    if (name.length === 0 || name.length > 200) {
      throw new Error('Name must be between 1 and 200 characters')
    }

    const email = args.email.trim().toLowerCase()
    if (email.length === 0 || email.length > 254) {
      throw new Error('Email must be between 1 and 254 characters')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please provide a valid email address')
    }

    await rateLimiter.limit(ctx, 'reservationCreate', { key: 'global', throws: true })
    await rateLimiter.limit(ctx, 'reservationPerEmail', { key: email, throws: true })
    await rateLimiter.limit(ctx, 'reservationPerEvent', { key: args.eventId, throws: true })

    const event = await ctx.db.get('events', args.eventId)
    if (!event) throw new Error('Event not found')

    if (event.status !== 'published') {
      throw new Error('Reservations are not open for this event')
    }
    if (event.endDate && event.endDate < Date.now()) {
      throw new Error('This event has ended')
    }

    if (
      event.reservationEnabled &&
      event.reservationLimit !== undefined &&
      (event.reservationCount ?? 0) >= event.reservationLimit
    ) {
      throw new Error('Reservation limit reached')
    }

    const profile = await getUserProfile(ctx)
    const userId = profile?._id

    await ctx.db.patch('events', args.eventId, {
      reservationCount: (event.reservationCount ?? 0) + 1,
    })

    const reservationId = await ctx.db.insert('reservationRequests', {
      eventId: args.eventId,
      userId,
      name,
      email,
      message: args.message?.trim() ?? '',
      status: 'pending',
    })

    ctx.scheduler.runAfter(0, internal.email.sendReservationConfirmation, {
      reservationId,
    })
    ctx.scheduler.runAfter(0, internal.email.sendAdminAlert, {
      reservationId,
    })

    return reservationId
  },
})

export const updateStatus = mutation({
  args: {
    reservationId: v.id('reservationRequests'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('cancelled'),
      v.literal('rejected'),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const reservation = await ctx.db.get('reservationRequests', args.reservationId)
    if (!reservation) throw new Error('Reservation not found')
    await ctx.db.patch('reservationRequests', args.reservationId, {
      status: args.status,
    })
    if (args.status === 'cancelled' && reservation.status !== 'cancelled') {
      const event = await ctx.db.get('events', reservation.eventId)
      if (event) {
        await ctx.db.patch('events', reservation.eventId, {
          reservationCount: Math.max(0, (event.reservationCount ?? 0) - 1),
        })
      }
    }
  },
})
