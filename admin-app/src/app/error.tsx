'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorPageProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden bg-card">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="text-destructive" size={24} />
            </div>
          </div>
          <CardTitle className="font-headline text-xl font-semibold tracking-tight text-foreground">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again or return to the dashboard.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground bg-surface-container-high rounded-lg px-3 py-2 font-mono">
              Error: {error.digest}
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={reset} className="w-full h-11">
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                router.push('/')
                router.refresh()
              }}
              className="w-full h-11"
            >
              <ArrowLeft size={16} />
              Go to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
