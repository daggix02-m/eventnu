import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Apply as an organizer | Event Nu',
  description: 'Create an Event Nu organizer account and submit your application for review.',
}

export default function OrganizerApplyPage() {
  redirect('/auth')
}
