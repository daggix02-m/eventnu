"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/lib/actions/contact";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, null);

  return (
    <form action={formAction} className="space-y-md">
      <div className="space-y-sm">
        <label htmlFor="name" className="font-mono text-label-sm text-on-surface-variant uppercase">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Your name"
        />
        {state?.success === false && state.errors?.name && (
          <p className="text-error text-body-md">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-sm">
        <label htmlFor="email" className="font-mono text-label-sm text-on-surface-variant uppercase">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="you@example.com"
        />
        {state?.success === false && state.errors?.email && (
          <p className="text-error text-body-md">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-sm">
        <label htmlFor="message" className="font-mono text-label-sm text-on-surface-variant uppercase">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={5}
          className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="How can we help?"
        />
        {state?.success === false && state.errors?.message && (
          <p className="text-error text-body-md">{state.errors.message[0]}</p>
        )}
      </div>

      {state?.success === false && state.errors?.root && (
        <p className="text-error text-body-md">{state.errors.root[0]}</p>
      )}
      {state?.success === true && (
        <p className="text-secondary text-body-md">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
