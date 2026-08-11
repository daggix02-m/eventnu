'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui'

interface SettingsCardProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  danger?: boolean
  children: ReactNode
}

export function SettingsCard({ icon: Icon, title, subtitle, danger, children }: SettingsCardProps) {
  return (
    <Card className={`p-6 ${danger ? 'border-destructive/30' : ''}`}>
      <div className={`flex items-center gap-3 ${subtitle ? 'mb-6' : 'mb-4'}`}>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            danger
              ? 'bg-destructive/10 text-destructive'
              : 'bg-surface-container-high text-muted-foreground'
          }`}
        >
          <Icon size={20} />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${danger ? 'text-destructive' : 'text-foreground'}`}>
            {title}
          </h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  )
}
