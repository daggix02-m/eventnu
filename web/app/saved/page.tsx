import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SavedEventsClient } from '@/components/saved/SavedEventsClient'
import { Container } from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'Saved Events | Event Nu',
  description: 'Your saved events on Event Nu, organized into folders.',
}

export default function SavedEventsPage() {
  return (
    <Container className="py-xl">
      <Suspense>
        <SavedEventsClient />
      </Suspense>
    </Container>
  )
}
