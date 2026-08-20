import type { Metadata } from 'next'
import { OrganizerDashboard } from '@/components/organizer-dashboard/OrganizerDashboard'

export const metadata: Metadata = {
  title: 'Organizer Dashboard | Event Nu',
  description: 'Manage your events, profile, and settings on Event Nu.',
}

export default function OrganizerDashboardPage() {
  return <OrganizerDashboard />
}
