'use client'

import { BarChart3, Calendar, Users, UserCheck, Flag, ScrollText } from 'lucide-react'
import { SettingsCard } from './SettingsCard'
import type { AdminStats } from './types'

interface AdminStatsSectionProps {
  stats: AdminStats
}

export function AdminStatsSection({ stats }: AdminStatsSectionProps) {
  const statsItems = [
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar },
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Organizers', value: stats.totalOrganizers, icon: UserCheck },
    { label: 'Open Reports', value: stats.openReports, icon: Flag },
    { label: 'Moderation Logs', value: stats.moderationCount, icon: ScrollText },
  ]

  return (
    <SettingsCard icon={BarChart3} title="Admin Stats" subtitle="Platform overview">
      <div className="space-y-3">
        {statsItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </SettingsCard>
  )
}
