'use client'

import { useActionState } from 'react'
import { submitContactForm } from '@/lib/actions/contact'
import { Button } from '@/components/ui/Button'

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, null)
  const nameError = state?.success === false ? state.errors?.name?.[0] : undefined
  const emailError = state?.success === false ? state.errors?.email?.[0] : undefined
  const messageError = state?.success === false ? state.errors?.message?.[0] : undefined
  const rootError = state?.success === false ? state.errors?.root?.[0] : undefined

  return (
    <form action={formAction} noValidate className="space-y-md">
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
          aria-describedby={nameError ? 'name-error' : undefined}
          aria-invalid={nameError ? true : undefined}
          className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Your name"
        />
        {nameError && (
          <p id="name-error" className="text-error text-body-md">
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-sm">
        <label
          htmlFor="email"
          className="font-mono text-label-sm text-on-surface-variant uppercase"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          aria-describedby={emailError ? 'email-error' : undefined}
          aria-invalid={emailError ? true : undefined}
          className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="you@example.com"
        />
        {emailError && (
          <p id="email-error" className="text-error text-body-md">
            {emailError}
          </p>
        )}
      </div>

      <div className="space-y-sm">
        <label
          htmlFor="message"
          className="font-mono text-label-sm text-on-surface-variant uppercase"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={5}
          aria-describedby={messageError ? 'message-error' : undefined}
          aria-invalid={messageError ? true : undefined}
          className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="How can we help?"
        />
        {messageError && (
          <p id="message-error" className="text-error text-body-md">
            {messageError}
          </p>
        )}
      </div>

      {rootError && <p className="text-error text-body-md">{rootError}</p>}
      {state?.success === true && <p className="text-secondary text-body-md">{state.message}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}
