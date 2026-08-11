import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfileClient } from '@/components/profile/ProfileClient'
import { Container } from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'My Profile | Event Nu',
  description: 'Your saved events and experience posts on Event Nu.',
}

export default function ProfilePage() {
  return (
    <Container className="py-xl">
      <Suspense>
        <ProfileClient />
      </Suspense>
    </Container>
  )
}
