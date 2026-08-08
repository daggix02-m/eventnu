'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Timer } from 'lucide-react'

const IDLE_LIMIT_MS = 30 * 60 * 1000
const WARN_LEAD_MS = 60 * 1000

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const

export function IdleTimeout() {
  const router = useRouter()
  const { signOut } = useAuthActions()

  const lastActivityRef = useRef(0)
  const signingOutRef = useRef(false)
  const [warnSeconds, setWarnSeconds] = useState<number | null>(null)

  useEffect(() => {
    lastActivityRef.current = Date.now()

    const markActive = () => {
      lastActivityRef.current = Date.now()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') markActive()
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActive, { passive: true })
    )
    window.addEventListener('focus', markActive)
    document.addEventListener('visibilitychange', onVisibility)

    const tick = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current

      if (elapsed >= IDLE_LIMIT_MS) {
        if (signingOutRef.current) return
        signingOutRef.current = true
        signOut()
          .then(() => {
            router.push('/auth/sign-in')
            router.refresh()
          })
          .finally(() => {
            signingOutRef.current = false
          })
        return
      }

      if (elapsed >= IDLE_LIMIT_MS - WARN_LEAD_MS) {
        setWarnSeconds(Math.ceil((IDLE_LIMIT_MS - elapsed) / 1000))
      } else {
        setWarnSeconds(null)
      }
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActive)
      )
      window.removeEventListener('focus', markActive)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(tick)
    }
  }, [signOut, router])

  const handleStaySignedIn = () => {
    lastActivityRef.current = Date.now()
    setWarnSeconds(null)
  }

  if (warnSeconds === null) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sm border-0 shadow-xl rounded-2xl bg-card">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
              <Timer size={20} />
            </div>
          </div>
          <CardTitle className="font-headline text-lg font-semibold tracking-tight text-foreground">
            Session expiring
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            You have been idle for a while. You will be signed out in{' '}
            <span className="font-semibold text-foreground">{warnSeconds}s</span>{' '}
            if you don&apos;t continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={handleStaySignedIn}
            className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Stay signed in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
