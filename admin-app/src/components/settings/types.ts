export interface AdminProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  username: string
  role: string
  created_at: string
}

export interface FeaturedSection {
  id: string
  label: string
  description: string
  enabled: boolean
  sort_order: number
}

export interface AdminStats {
  totalEvents: number
  totalUsers: number
  totalHosts: number
  totalOrganizers: number
  openReports: number
  moderationCount: number
}

export interface NotificationPrefs {
  emailReports: boolean
  emailEvents: boolean
  emailUsers: boolean
  pushEnabled: boolean
}
