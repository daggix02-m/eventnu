"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Ticket, Loader2 } from "lucide-react";
import type { Event } from "@/types";

interface ReservationFormProps {
  event: Event;
}

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface-container-low px-md py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary";

export function ReservationForm({ event }: ReservationFormProps) {
  const createReservation = useMutation(api.reservations.create);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const remaining =
    event.reservation_enabled && event.reservation_limit != null
      ? event.reservation_limit
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setStatus("error");
      setError("Please provide your name and email.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await createReservation({
        eventId: event.id as any,
        name: name.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not submit your reservation.");
    }
  };

  if (status === "done") {
    return (
      <div className="p-lg bg-surface-container-high border border-outline-variant rounded-xl space-y-sm">
        <div className="flex items-center gap-md">
          <Ticket className="w-6 h-6 text-primary" />
          <p className="font-display text-headline-md">Reservation received!</p>
        </div>
        <p className="text-body-md text-on-surface-variant">
          We&apos;ll confirm your spot for {event.title}. Watch your inbox for updates.
        </p>
      </div>
    );
  }

  return (
    <div className="p-lg bg-surface-container-high border border-outline-variant rounded-xl space-y-md">
      <div className="flex items-center gap-md">
        <Ticket className="w-6 h-6 text-primary" />
        <div>
          <p className="font-display text-headline-md">Reserve a spot</p>
          {remaining != null && (
            <p className="text-label-sm text-on-surface-variant">Capacity: {remaining} spots</p>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-md">
        <div>
          <label htmlFor={`res-name-${event.id}`} className="sr-only">
            Full name
          </label>
          <input
            id={`res-name-${event.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`res-email-${event.id}`} className="sr-only">
            Email
          </label>
          <input
            id={`res-email-${event.id}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`res-msg-${event.id}`} className="sr-only">
            Message (optional)
          </label>
          <textarea
            id={`res-msg-${event.id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (optional)"
            rows={2}
            className={inputClass}
          />
        </div>
        {status === "error" && <p className="text-label-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            "Request reservation"
          )}
        </Button>
      </form>
    </div>
  );
}
