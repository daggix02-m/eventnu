'use server'

import { revalidatePath } from 'next/cache'
import { fetchMutation } from 'convex/nextjs'
import { api } from '@eventnu/convex/_generated/api'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactFormState =
  { success: false; errors: Record<string, string[]> } | { success: true; message: string } | null

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await fetchMutation(api.cms.contact.submitContact, {
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    })
  } catch (error) {
    logError('actions/submitContact', error)
    let message = 'Something went wrong. Please try again later.'
    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes('rate limit')) {
        message = 'Too many requests. Please wait a moment before trying again.'
      } else if (msg.includes('network') || msg.includes('fetch')) {
        message = 'Unable to connect to the server. Please check your connection.'
      }
    }
    return {
      success: false,
      errors: { root: [message] },
    }
  }

  revalidatePath('/contact')
  return { success: true, message: 'Thank you for your message. We will get back to you soon.' }
}
