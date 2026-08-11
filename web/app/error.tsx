'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-gutter text-center space-y-md">
      <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
        <AlertTriangle className="text-error" size={24} />
      </div>
      <h1 className="font-display text-headline-md text-on-surface">Something went wrong</h1>
      <p className="text-on-surface-variant text-body-md max-w-[28rem]">
        We couldn&apos;t load this page. It may be temporarily unavailable.
      </p>
      <div className="flex gap-sm">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Find Events</Link>
        </Button>
      </div>
    </div>
  )
}
