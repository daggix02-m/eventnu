'use client'

import { Card } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'
import { usernameFromEmail } from '@/lib/mappers'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import {
  InstagramSettingsCard,
  type InstagramStatus,
} from '@/components/instagram/InstagramSettingsCard'
import { ProfileSection } from './ProfileSection'
import { SecuritySection } from './SecuritySection'
import { FeaturedSectionsSection } from './FeaturedSectionsSection'
import { DangerZoneSection } from './DangerZoneSection'
import { NotificationsSection } from './NotificationsSection'
import { AdminStatsSection } from './AdminStatsSection'
import { AccountInfoSection } from './AccountInfoSection'
import type { AdminProfile, FeaturedSection, AdminStats, NotificationPrefs } from './types'

interface SettingsClientProps {
  profile: Doc<'profiles'> | null
  featuredSections: FeaturedSection[]
  adminStats: AdminStats
  notificationPrefs: NotificationPrefs
  instagramStatus?: InstagramStatus | null
  instagramNotice?: string | null
  instagramErrorNotice?: string | null
}

export function SettingsClient({
  profile: profileData,
  featuredSections = [],
  adminStats,
  notificationPrefs,
  instagramStatus,
  instagramNotice,
  instagramErrorNotice,
}: SettingsClientProps) {
  const profile: AdminProfile | null = profileData
    ? {
        id: profileData._id,
        email: profileData.email ?? '',
        full_name: profileData.fullName ?? '',
        avatar_url: profileData.avatarUrl ?? '',
        username: usernameFromEmail(profileData.email),
        role: profileData.role ?? 'admin',
        created_at: new Date(profileData._creationTime).toISOString(),
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your admin profile, preferences, and security.
        </p>
      </div>

      {!profile ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Unable to load profile. Please sign in again.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileSection profile={profile} />
            <SecuritySection />
            <FeaturedSectionsSection sections={featuredSections} />
            <DangerZoneSection />
          </div>

          {/* Right Column - Preferences & Stats */}
          <div className="space-y-6">
            <NotificationsSection prefs={notificationPrefs} />
            <AdminStatsSection stats={adminStats} />
            <InstagramSettingsCard
              initialStatus={instagramStatus ?? null}
              notice={instagramNotice}
              errorNotice={instagramErrorNotice}
            />
            <AccountInfoSection profile={profile} />
          </div>
        </div>
      )}
    </div>
  )
}
