'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { User, ShieldCheck, Lock, MessageSquarePlus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { AvatarUploader } from '@/components/profile/settings/AvatarUploader'
import { PersonalInfoForm } from '@/components/profile/settings/PersonalInfoForm'
import { ChangePasswordForm } from '@/components/profile/settings/ChangePasswordForm'
import { PrivacySettings } from '@/components/profile/settings/PrivacySettings'
import { ExperiencePostsManager } from '@/components/profile/settings/ExperiencePostsManager'

const TABS = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'security', label: 'Account & Security', icon: Lock },
  { value: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { value: 'posts', label: 'My experience posts', icon: MessageSquarePlus },
] as const

export function ProfileSettingsClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const searchParams = useSearchParams()
  const router = useRouter()
  const me = useQuery(api.profiles.getMe)
  const [tab, setTab] = useState<string>(() => searchParams.get('tab') ?? 'profile')

  const handleTabChange = (value: string) => {
    setTab(value)
    router.replace(`/profile/settings?tab=${value}`)
  }

  if (authLoading || me === undefined) {
    return (
      <div className="mx-auto w-full max-w-[44rem] space-y-md" aria-hidden="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!isAuthenticated || me === null) {
    return (
      <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center sm:p-8">
        <User className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="mt-sm font-display text-headline-md text-on-surface">
          Sign in to manage your account
        </h1>
        <p className="mt-xs font-body-md text-on-surface-variant">
          Change your photo, password, and privacy settings.
        </p>
        <Button className="mt-lg" onClick={() => openAuth('/profile/settings')}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[44rem] space-y-lg">
      <header>
        <h1 className="font-display text-headline-md text-on-surface">Settings</h1>
        <p className="font-body-md text-on-surface-variant">
          Manage your profile, account security, and privacy.
        </p>
      </header>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 gap-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="w-full">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="space-y-md">
          <AvatarUploader
            avatarUrl={me.avatarUrl ?? null}
            avatarStorageId={me.avatarStorageId ?? null}
            fullName={me.fullName ?? null}
          />
          <PersonalInfoForm
            fullName={me.fullName ?? null}
            bio={me.bio ?? null}
            username={me.username ?? null}
            locationText={me.locationText ?? null}
            website={me.website ?? null}
          />
        </TabsContent>
        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacySettings
            privateProfile={me.privateProfile ?? false}
            emailNotifications={me.emailNotifications ?? true}
            pushNotifications={me.pushNotifications ?? false}
          />
        </TabsContent>
        <TabsContent value="posts">
          <ExperiencePostsManager profileId={me._id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
