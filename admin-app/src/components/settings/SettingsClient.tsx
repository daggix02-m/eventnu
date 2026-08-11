'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getUploadUrl, resolveStorageUrls } from '@/lib/actions/events'
import { updateFeaturedSection, updateAdminNotificationPrefs } from '@/lib/actions/settings'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import {
  User,
  Lock,
  Bell,
  Mail,
  Save,
  CheckCircle,
  AlertTriangle,
  Globe,
  Shield,
  Camera,
  Layout,
  BarChart3,
  Trash2,
  RefreshCw,
  Users,
  Calendar,
  Building2,
  UserCheck,
  Flag,
  ScrollText,
  Loader2,
} from 'lucide-react'
import { updateProfile } from '@/lib/actions/users'
import { changePassword } from '@/lib/actions/auth'
import { usernameFromEmail } from '@/lib/mappers'
import {
  InstagramSettingsCard,
  type InstagramStatus,
} from '@/components/instagram/InstagramSettingsCard'
interface AdminProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  username: string
  role: string
  created_at: string
}

interface FeaturedSection {
  id: string
  label: string
  description: string
  enabled: boolean
  sort_order: number
}

interface AdminStats {
  totalEvents: number
  totalUsers: number
  totalHosts: number
  totalOrganizers: number
  openReports: number
  moderationCount: number
}

interface SettingsClientProps {
  featuredSections: FeaturedSection[]
  adminStats: AdminStats
  instagramStatus?: InstagramStatus | null
  instagramNotice?: string | null
  instagramErrorNotice?: string | null
}

export function SettingsClient({
  featuredSections = [],
  adminStats,
  instagramStatus,
  instagramNotice,
  instagramErrorNotice,
}: SettingsClientProps) {
  const router = useRouter()
  const profileData = useQuery(api.profiles.getMe)
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
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    avatar_url: profile?.avatar_url || '',
  })
  const [notifications, setNotifications] = useState({
    emailReports: true,
    emailEvents: true,
    emailUsers: true,
    pushEnabled: false,
  })
  const notificationPrefs = useQuery(
    api.adminSettings.getByAdmin,
    profile ? { adminId: profile.id as Id<'profiles'> } : 'skip',
  )
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionEditForm, setSectionEditForm] = useState({ label: '', description: '' })
  const [isUpdatingSection, setIsUpdatingSection] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (notificationPrefs) {
      setNotifications({
        emailReports: notificationPrefs.emailReports,
        emailEvents: notificationPrefs.emailEvents,
        emailUsers: notificationPrefs.emailUsers,
        pushEnabled: false,
      })
    }
  }, [notificationPrefs])

  const handleToggleNotification = async (
    key: 'emailReports' | 'emailEvents' | 'emailUsers',
    checked: boolean,
  ) => {
    if (!profile) return
    const next = { ...notifications, [key]: checked }
    setNotifications(next)
    try {
      await updateAdminNotificationPrefs(profile.id, {
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
    if (!profile) return
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('Please fill in all password fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.new.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordForm.current === passwordForm.new) {
      toast.error('New password must be different from current password')
      return
    }

    setIsLoading(true)
    try {
      const result = await changePassword(passwordForm.current, passwordForm.new)
      if (result.ok) {
        toast.success('Password changed successfully')
        setPasswordForm({ current: '', new: '', confirm: '' })
      } else {
        const messages: Record<string, string> = {
          invalid_current_password: 'Current password is incorrect',
          rate_limited: 'Too many failed attempts. Please try again later.',
          not_authenticated: 'Please sign in again to change your password.',
        }
        toast.error(messages[result.reason] || 'Failed to change password')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to change password'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSection = async (section: FeaturedSection) => {
    setIsUpdatingSection(true)
    try {
      await updateFeaturedSection(section.id, { enabled: !section.enabled })
      toast.success(`${section.label} ${!section.enabled ? 'enabled' : 'disabled'}`)
      router.refresh()
    } catch (err) {
      toast.error('Failed to update section')
    } finally {
      setIsUpdatingSection(false)
    }
  }

  const startEditingSection = (section: FeaturedSection) => {
    setEditingSection(section.id)
    setSectionEditForm({ label: section.label, description: section.description || '' })
  }

  const handleSaveSection = async (sectionId: string) => {
    setIsUpdatingSection(true)
    try {
      await updateFeaturedSection(sectionId, {
        label: sectionEditForm.label,
        description: sectionEditForm.description,
      })
      toast.success('Section updated')
      setEditingSection(null)
      router.refresh()
    } catch (err) {
      toast.error('Failed to update section')
    } finally {
      setIsUpdatingSection(false)
    }
  }

  const handleClearCache = () => {
    router.refresh()
    toast.success('Cache cleared')
  }

  const statsItems = [
    { label: 'Total Events', value: adminStats.totalEvents, icon: Calendar },
    { label: 'Total Users', value: adminStats.totalUsers, icon: Users },
    { label: 'Hosts', value: adminStats.totalHosts, icon: Building2 },
    { label: 'Organizers', value: adminStats.totalOrganizers, icon: UserCheck },
    { label: 'Open Reports', value: adminStats.openReports, icon: Flag },
    { label: 'Moderation Logs', value: adminStats.moderationCount, icon: ScrollText },
  ]

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Admin preferences and configuration.</p>
        </div>
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Unable to load profile. Please sign in again.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your admin profile, preferences, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">Update your personal information</p>
              </div>
            </div>

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
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Role: {profile.role}
                  </p>
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
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground"
                >
                  <Save size={16} className="mr-2" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Password Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Security</h2>
                <p className="text-sm text-muted-foreground">Update your password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" variant="outline" disabled={isLoading}>
                  <Lock size={16} className="mr-2" />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Must be at least 8 characters. You will remain signed in after changing.
                </p>
              </div>
            </form>
          </Card>

          {/* Platform Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Layout size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Platform Configuration</h2>
                <p className="text-sm text-muted-foreground">Manage featured sections</p>
              </div>
            </div>

            {featuredSections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No featured sections configured.
              </p>
            ) : (
              <div className="space-y-2">
                {featuredSections.map((section) => {
                  const isEditing = editingSection === section.id
                  return (
                    <div key={section.id} className="border border-outline-variant rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={sectionEditForm.label}
                                onChange={(e) =>
                                  setSectionEditForm({ ...sectionEditForm, label: e.target.value })
                                }
                                placeholder="Section label"
                              />
                              <Input
                                value={sectionEditForm.description}
                                onChange={(e) =>
                                  setSectionEditForm({
                                    ...sectionEditForm,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Section description"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground truncate">
                                {section.label}
                              </p>
                              {section.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {section.description}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSaveSection(section.id)}
                                disabled={isUpdatingSection}
                                className="bg-primary text-primary-foreground"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSection(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Switch
                                checked={section.enabled}
                                onCheckedChange={() => handleToggleSection(section)}
                                disabled={isUpdatingSection}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingSection(section)}
                              >
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">System operations</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Clear cache</p>
                  <p className="text-xs text-muted-foreground">Refresh all server-side data</p>
                </div>
                <Button variant="outline" onClick={handleClearCache}>
                  <RefreshCw size={16} className="mr-2" />
                  Clear Cache
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Preferences & Stats */}
        <div className="space-y-6">
          {/* Notifications Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Email alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Report alerts</p>
                    <p className="text-xs text-muted-foreground">New user reports</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailReports}
                  onCheckedChange={(checked) => handleToggleNotification('emailReports', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Event submissions</p>
                    <p className="text-xs text-muted-foreground">Pending review events</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailEvents}
                  onCheckedChange={(checked) => handleToggleNotification('emailEvents', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">User activity</p>
                    <p className="text-xs text-muted-foreground">New signups</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailUsers}
                  onCheckedChange={(checked) => handleToggleNotification('emailUsers', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Admin Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Admin Stats</h2>
                <p className="text-sm text-muted-foreground">Platform overview</p>
              </div>
            </div>
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
          </Card>

          {/* Integrations */}
          <InstagramSettingsCard
            initialStatus={instagramStatus ?? null}
            notice={instagramNotice}
            errorNotice={instagramErrorNotice}
          />

          {/* System Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Account Info</h2>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="text-foreground font-mono text-xs">
                  {profile.id.slice(0, 12)}...
                </span>
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
          </Card>
        </div>
      </div>
    </div>
  )
}
