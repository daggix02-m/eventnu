'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getUploadUrl, resolveStorageUrls } from '@/lib/actions/events'
import { updateProfile } from '@/lib/actions/users'
import { getErrorMessage } from '@/lib/errors'
import { User, Save, Camera, Loader2 } from 'lucide-react'
import { SettingsCard } from './SettingsCard'
import type { AdminProfile } from './types'

interface ProfileSectionProps {
  profile: AdminProfile
}

export function ProfileSection({ profile }: ProfileSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name,
    email: profile.email,
    avatar_url: profile.avatar_url || '',
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const uploadUrl = await getUploadUrl()
      let parsed: URL
      try {
        parsed = new URL(uploadUrl)
      } catch {
        throw new Error('Invalid upload URL')
      }
      if (!parsed.protocol.startsWith('https:') && parsed.protocol !== 'http:') {
        throw new Error('Invalid upload URL')
      }
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
        credentials: 'omit',
      })
      if (!res.ok) throw new Error('Upload failed')
      const { storageId } = await res.json()
      if (!storageId) throw new Error('Upload failed')
      const urls = await resolveStorageUrls([storageId])
      if (urls[0]) {
        setForm((prev) => ({ ...prev, avatar_url: urls[0] as string }))
        toast.success('Avatar uploaded')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Avatar upload failed'))
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateProfile(profile.id, {
        full_name: form.full_name,
        email: form.email,
        avatar_url: form.avatar_url,
      })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingsCard icon={User} title="Profile" subtitle="Update your personal information">
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-2xl">
                  {(form.full_name || 'A').charAt(0)}
                </div>
              )}
            </Avatar>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              title="Change avatar"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{form.full_name || 'Admin'}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">Role: {profile.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Avatar URL</label>
          <Input
            value={form.avatar_url}
            onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground">
            <Save size={16} className="mr-2" />
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </SettingsCard>
  )
}
