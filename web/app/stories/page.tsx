import type { Metadata } from 'next'
import { Suspense } from 'react'
import { StoriesPageClient } from '@/components/stories/StoriesPageClient'
import { Container } from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'Stories | Event Nu',
  description: 'Community stories from events across Addis Ababa — gone after 24 hours.',
}

export default function StoriesPage() {
  return (
    <Container className="py-xl">
      <Suspense>
        <StoriesPageClient />
      </Suspense>
    </Container>
  )
}
