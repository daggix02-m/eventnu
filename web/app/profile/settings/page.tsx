import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfileSettingsClient } from '@/components/profile/settings/ProfileSettingsClient'
import { Container } from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'Settings | Event Nu',
  description: 'Manage your Event Nu profile, account security, privacy, and experience posts.',
}

export default function ProfileSettingsPage() {
  return (
    <Container className="py-xl">
      <Suspense>
        <ProfileSettingsClient />
      </Suspense>
    </Container>
  )
}
