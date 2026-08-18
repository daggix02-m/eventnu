import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { AuroraPanel } from '@/components/auth/AuroraPanel'

export function AuthShell({
  title,
  description,
  children,
  asideTitle,
  asideDescription,
}: {
  title: string
  description: string
  children: ReactNode
  asideTitle: string
  asideDescription: string
}) {
  return (
    <>
      <AuroraPanel />

      <div className="relative flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 lg:justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center lg:mb-12"
        >
          <Link
            href="/"
            className="inline-block font-display text-headline-md font-bold tracking-tight text-white"
          >
            Event Nu
          </Link>
          <p className="mt-2 max-w-[20rem] text-body-md text-white/60 sm:text-body-lg">
            {asideDescription}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[28rem]"
        >
          <div className="rounded-3xl border border-white/[0.08] bg-surface-container-low/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl sm:p-8">
            <header className="mb-6">
              <h1 className="font-display text-display-sm text-on-surface sm:text-display-md">
                {title}
              </h1>
              <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
            </header>
            {children}
          </div>
        </motion.div>
      </div>
    </>
  )
}
