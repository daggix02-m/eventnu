import type { Metadata } from 'next'
import { AuthPage } from '@/components/auth/AuthPage'

export const metadata: Metadata = {
  title: 'Sign in or create an account | Event Nu',
  description: 'Join Event Nu as a guest to discover events, or as an organizer to list yours.',
}

export default function AuthPageRoute() {
  return <AuthPage />
}
