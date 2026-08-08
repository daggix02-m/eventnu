import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getUserProfile, requireAdmin } from "./helpers";
import { rateLimiter } from "./rateLimiter";

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("reservationRequests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(100);
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "reservationCreate", { key: "global", throws: true });
    await rateLimiter.limit(ctx, "reservationPerEmail", { key: args.email, throws: true });

    const event = await ctx.db.get("events", args.eventId);
    if (!event) throw new Error("Event not found");

    if (
      event.reservationEnabled &&
      event.reservationLimit !== undefined &&
      (event.reservationCount ?? 0) >= event.reservationLimit
    ) {
      throw new Error("Reservation limit reached");
    }

    const profile = await getUserProfile(ctx);
    const userId = profile?._id;

    await ctx.db.patch("events", args.eventId, {
      reservationCount: (event.reservationCount ?? 0) + 1,
    });

    const reservationId = await ctx.db.insert("reservationRequests", {
      eventId: args.eventId,
      userId,
      name: args.name,
      email: args.email,
      message: args.message ?? "",
      status: "pending",
    });

    ctx.scheduler.runAfter(0, api.email.sendReservationConfirmation, {
      reservationId,
    });
    ctx.scheduler.runAfter(0, api.email.sendAdminAlert, {
      reservationId,
    });

    return reservationId;
  },
});

export const updateStatus = mutation({
  args: {
    reservationId: v.id("reservationRequests"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const reservation = await ctx.db.get("reservationRequests", args.reservationId);
    if (!reservation) throw new Error("Reservation not found");
    await ctx.db.patch("reservationRequests", args.reservationId, {
      status: args.status,
    });
    if (args.status === "cancelled" && reservation.status !== "cancelled") {
      const event = await ctx.db.get("events", reservation.eventId);
      if (event) {
        await ctx.db.patch("events", reservation.eventId, {
          reservationCount: Math.max(0, (event.reservationCount ?? 0) - 1),
        });
      }
    }
  },
});
