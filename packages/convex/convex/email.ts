import { v } from "convex/values";
import { action, internalQuery, env } from "./_generated/server";
import { internal } from "./_generated/api";

const RESEND_BASE = "https://api.resend.com";
const FROM = "eventnu <hello@eventnu.et>";

function getResendApiKey(): string {
  const e = env as unknown as Record<string, string | undefined>;
  const key = e.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  return key;
}

async function resendFetch(
  path: string,
  body: Record<string, unknown>,
): Promise<{ id: string } | { message: string }> {
  const res = await fetch(`${RESEND_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
  return res.json();
}

export const getReservation = internalQuery({
  args: { reservationId: v.id("reservationRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get("reservationRequests", args.reservationId);
  },
});

export const getEvent = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get("events", args.eventId);
  },
});

export const getAdminEmails = internalQuery({
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("profiles")
      .collect()
      .then((profiles) => profiles.filter((p) => p.role === "admin" && p.email));
    return admins.map((a) => a.email as string);
  },
});

function formatDate(ts: number, tz: string): string {
  return new Date(ts).toLocaleString("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const sendReservationConfirmation = action({
  args: { reservationId: v.id("reservationRequests") },
  handler: async (ctx, args) => {
    const reservation = await ctx.runQuery(
      internal.email.getReservation,
      { reservationId: args.reservationId },
    );
    if (!reservation) return;

    const event = await ctx.runQuery(
      internal.email.getEvent,
      { eventId: reservation.eventId },
    );
    if (!event) return;

    const eventDate = formatDate(event.startDate, event.timezone);
    const location = event.venueName
      ? `${event.venueName}${event.venueAddress ? `, ${event.venueAddress}` : ""}`
      : "Online";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">Reservation Confirmed</h2>
        <p>Hi ${reservation.name},</p>
        <p>Your reservation for <strong>${event.title}</strong> has been received.</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin:0 0 8px"><strong>Location:</strong> ${location}</p>
          <p style="margin:0"><strong>Status:</strong> ${reservation.status}</p>
        </div>
        ${event.venueMapLink ? `<p><a href="${event.venueMapLink}" style="color:#2563eb">View on map</a></p>` : ""}
        <p style="color:#666;font-size:14px;margin-top:24px">You'll receive updates as the event approaches.</p>
      </div>
    `;

    await resendFetch("/emails", {
      from: FROM,
      to: reservation.email,
      subject: `Reservation confirmed — ${event.title}`,
      html,
    });
  },
});

export const sendAdminAlert = action({
  args: { reservationId: v.id("reservationRequests") },
  handler: async (ctx, args) => {
    const reservation = await ctx.runQuery(
      internal.email.getReservation,
      { reservationId: args.reservationId },
    );
    if (!reservation) return;

    const event = await ctx.runQuery(
      internal.email.getEvent,
      { eventId: reservation.eventId },
    );
    if (!event) return;

    const adminEmails = await ctx.runQuery(internal.email.getAdminEmails);
    if (adminEmails.length === 0) return;

    const eventDate = formatDate(event.startDate, event.timezone);

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">New Reservation</h2>
        <p>A new reservation was made for <strong>${event.title}</strong>.</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Name:</strong> ${reservation.name}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> ${reservation.email}</p>
          <p style="margin:0 0 8px"><strong>Event:</strong> ${event.title}</p>
          <p style="margin:0 0 8px"><strong>Date:</strong> ${eventDate}</p>
          ${reservation.message ? `<p style="margin:0"><strong>Message:</strong> ${reservation.message}</p>` : ""}
        </div>
      </div>
    `;

    await resendFetch("/emails", {
      from: FROM,
      to: adminEmails,
      subject: `New reservation — ${event.title}`,
      html,
    });
  },
});
