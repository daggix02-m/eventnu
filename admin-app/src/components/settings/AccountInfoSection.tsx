'use client'

import { Shield, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { SettingsCard } from './SettingsCard'
import type { AdminProfile } from './types'

interface AccountInfoSectionProps {
  profile: AdminProfile
}

export function AccountInfoSection({ profile }: AccountInfoSectionProps) {
  return (
    <SettingsCard icon={Shield} title="Account Info">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">User ID</span>
          <span className="text-foreground font-mono text-xs">{profile.id.slice(0, 12)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Role</span>
          <span className="text-foreground capitalize">{profile.role}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Joined</span>
          <span className="text-foreground">{formatDate(profile.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle size={12} />
            Active
          </span>
        </div>
      </div>
    </SettingsCard>
  )
}
