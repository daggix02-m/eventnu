'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Download, Share, PlusSquare, X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS specific property
      Boolean(window.navigator.standalone)

    setIsStandalone(isAppStandalone)
    if (isAppStandalone) return

    // Check if dismissed in the last 7 days
    const lastDismissed = localStorage.getItem('eventnu_pwa_dismissed')
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10)
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
    if (isAppleDevice && isSafari) {
      setIsIOS(true)
      setDismissed(false)
      return
    }

    // Standard BeforeInstallPrompt for Chromium / Android / Edge / Chrome Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt')
      setDeferredPrompt(null)
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowIOSGuide(false)
    localStorage.setItem('eventnu_pwa_dismissed', Date.now().toString())
  }

  const isSchedulePage = pathname === '/schedule'

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS) || isSchedulePage) {
    return null
  }

  return (
    <>
      {/* Floating Install App Banner */}
      <div className="fixed bottom-[calc(9rem_+_env(safe-area-inset-bottom))] md:bottom-6 right-4 left-4 md:left-auto md:max-w-[24rem] z-70 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-on-surface">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-outline-variant/50 bg-black/40 flex items-center justify-center p-1">
              <Image
                src="/logo.png"
                alt="Event Nu logo"
                width={36}
                height={36}
                className="rounded-lg object-contain"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">Install Event Nu App</h4>
              <p className="text-xs text-on-surface-variant truncate">
                Fast launch & offline experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss installation prompt"
              className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-[24rem]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Event Nu"
                width={40}
                height={40}
                className="rounded-xl border border-outline-variant/40"
              />
              <div>
                <DialogTitle>Install on iPhone / iPad</DialogTitle>
                <DialogDescription>Install just like an App Store app</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 text-sm text-on-surface bg-surface-container/60 p-4 rounded-2xl border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <span>
                1. Tap the <strong className="text-white">Share</strong> icon in Safari&apos;s
                bottom toolbar
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <span>
                2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>
              </span>
            </div>
          </div>

          <DialogClose asChild>
            <button
              type="button"
              className="w-full bg-primary text-on-primary font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-all text-sm cursor-pointer"
            >
              Got it
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
