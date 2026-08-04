'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../web/convex/_generated/api'
import { Button } from 'company-design-system'
import { Card } from 'company-design-system'
import { Avatar } from 'company-design-system'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  User,
  Lock,
  Palette,
  Bell,
  Mail,
  Save,
  Sun,
  Moon,
  Monitor,
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
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { updateProfile } from '@/lib/actions/users'
import { updateFeaturedSection } from '@/lib/actions/settings'
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
  profile: AdminProfile | null
  featuredSections: FeaturedSection[]
  adminStats: AdminStats
  instagramStatus?: InstagramStatus | null
  instagramNotice?: string | null
  instagramErrorNotice?: string | null
}

export function SettingsClient({
  profile: _profile,
  featuredSections = [],
  adminStats,
  instagramStatus,
  instagramNotice,
  instagramErrorNotice,
}: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const profileData = useQuery(api.profiles.getMe)
  const profile = profileData
    ? {
        id: profileData._id,
        email: profileData.email ?? '',
        full_name: profileData.fullName ?? '',
        avatar_url: profileData.avatarUrl ?? '',
        username: usernameFromEmail(profileData.email),
        role: profileData.role ?? 'admin',
        created_at: new Date(profileData._creationTime).toISOString(),
      }
    : _profile
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingPassword] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    avatar_url: profile?.avatar_url || '',
  })
  const [notifications, setNotifications] = useState({
    emailReports: true,
    emailEvents: true,
    emailUsers: false,
    pushEnabled: false,
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionEditForm, setSectionEditForm] = useState({ label: '', description: '' })
  const [isUpdatingSection, setIsUpdatingSection] = useState(false)

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
    toast.info('Password change is not available yet. Configure SMTP first.')
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

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

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
          <h1 className="text-3xl font-bold text-primary tracking-tight">Settings</h1>
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
        <h1 className="text-3xl font-bold text-primary tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin profile, preferences, and security.</p>
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
                      <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-2xl">
                        {(form.full_name || 'A').charAt(0)}
                      </div>
                    )}
                  </Avatar>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
                    onClick={() => {
                      const url = prompt('Enter avatar URL:', form.avatar_url)
                      if (url !== null) setForm({ ...form, avatar_url: url })
                    }}
                    title="Change avatar"
                  >
                    <Camera size={14} />
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
                <label className="text-sm font-medium text-muted-foreground">Current Password</label>
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
                  <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" variant="outline" disabled={isChangingPassword}>
                  <Lock size={16} className="mr-2" />
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
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
              <p className="text-sm text-muted-foreground py-4 text-center">No featured sections configured.</p>
            ) : (
              <div className="space-y-2">
                {featuredSections.map((section) => {
                  const isEditing = editingSection === section.id
                  return (
                    <div
                      key={section.id}
                      className="border border-outline-variant rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={sectionEditForm.label}
                                onChange={(e) => setSectionEditForm({ ...sectionEditForm, label: e.target.value })}
                                placeholder="Section label"
                              />
                              <Input
                                value={sectionEditForm.description}
                                onChange={(e) => setSectionEditForm({ ...sectionEditForm, description: e.target.value })}
                                placeholder="Section description"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground truncate">{section.label}</p>
                              {section.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.description}</p>
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
          {/* Theme Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">Choose your theme</p>
              </div>
            </div>

            <div className="space-y-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = theme === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-sm font-medium text-left">{option.label}</span>
                    {isActive && <CheckCircle size={16} />}
                  </button>
                )
              })}
            </div>
          </Card>

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
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailReports: checked })}
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
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailEvents: checked })}
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
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailUsers: checked })}
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
                    <span className="text-sm font-semibold text-foreground">{item.value.toLocaleString()}</span>
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
                <span className="text-foreground font-mono text-xs">{profile.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="text-foreground capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString()}</span>
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
