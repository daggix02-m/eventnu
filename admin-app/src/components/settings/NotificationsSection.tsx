'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateAdminNotificationPrefs } from '@/lib/actions/settings'
import { Bell, Mail, Globe, User } from 'lucide-react'
import { SettingsCard } from './SettingsCard'
import type { NotificationPrefs } from './types'

interface NotificationsSectionProps {
  prefs: NotificationPrefs
}

export function NotificationsSection({ prefs }: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState(prefs)

  useEffect(() => {
    setNotifications(prefs)
  }, [prefs])

  const handleToggleNotification = async (
    key: 'emailReports' | 'emailEvents' | 'emailUsers',
    checked: boolean,
  ) => {
    const next = { ...notifications, [key]: checked }
    setNotifications(next)
    try {
      await updateAdminNotificationPrefs({
        email_reports: next.emailReports,
        email_events: next.emailEvents,
        email_users: next.emailUsers,
      })
      toast.success('Notification preference saved')
    } catch {
      toast.error('Failed to save notification preference')
      setNotifications({ ...notifications, [key]: !checked })
    }
  }

  const items: {
    key: 'emailReports' | 'emailEvents' | 'emailUsers'
    icon: typeof Mail
    title: string
    subtitle: string
  }[] = [
    { key: 'emailReports', icon: Mail, title: 'Report alerts', subtitle: 'New user reports' },
    {
      key: 'emailEvents',
      icon: Globe,
      title: 'Event submissions',
      subtitle: 'Pending review events',
    },
    { key: 'emailUsers', icon: User, title: 'User activity', subtitle: 'New signups' },
  ]

  return (
    <SettingsCard icon={Bell} title="Notifications" subtitle="Email alerts">
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) => handleToggleNotification(item.key, checked)}
              />
            </div>
          )
        })}
      </div>
    </SettingsCard>
  )
}
