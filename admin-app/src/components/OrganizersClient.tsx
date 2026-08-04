'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from 'company-design-system'
import { Badge } from 'company-design-system'
import { Avatar } from 'company-design-system'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Search,
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  Globe,
  Mail,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from 'lucide-react'
import { format } from 'date-fns'
import { verifyOrganizer, unverifyOrganizer, suspendOrganizer, unsuspendOrganizer } from '@/lib/actions/organizers'
import { useRouter } from 'next/navigation'

interface Organizer {
  profile_id: string
  organizer_name: string
  bio: string
  logo_url?: string
  website?: string
  contact_email?: string
  social_links?: any
  follower_count: number
  verified: boolean
  created_at: string
  updated_at: string
  organizer_handle: string
  profiles: {
    id: string
    username: string
    full_name: string
    email: string
    avatar_url?: string
    suspended: boolean
  }[]
}

interface OrganizersClientProps {
  initialOrganizers: Organizer[]
  initialCount: number
  initialFilters: { verified?: string; search?: string; page?: number }
}

export function OrganizersClient({ initialOrganizers, initialCount, initialFilters }: OrganizersClientProps) {
  const [organizers, setOrganizers] = useState(initialOrganizers)
  const [count, setCount] = useState(initialCount)
  const [filters, setFilters] = useState(initialFilters)
  const [, setIsLoading] = useState(false)
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setOrganizers(initialOrganizers)
    setCount(initialCount)
    setFilters(initialFilters)
  }, [initialOrganizers, initialCount, initialFilters])

  const perPage = 20
  const totalPages = Math.ceil(count / perPage)

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    router.push(`/organizers?${new URLSearchParams(newFilters as any).toString()}`)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    router.push(`/organizers?${new URLSearchParams(newFilters as any).toString()}`)
  }

  const handleVerify = async (profileId: string) => {
    setIsLoading(true)
    try {
      await verifyOrganizer(profileId)
      router.refresh()
    } catch (err) {
      console.error('Verify error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnverify = async (profileId: string) => {
    setIsLoading(true)
    try {
      await unverifyOrganizer(profileId)
      router.refresh()
    } catch (err) {
      console.error('Unverify error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspend = async (profileId: string) => {
    setIsLoading(true)
    try {
      await suspendOrganizer(profileId)
      router.refresh()
    } catch (err) {
      console.error('Suspend error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async (profileId: string) => {
    setIsLoading(true)
    try {
      await unsuspendOrganizer(profileId)
      router.refresh()
    } catch (err) {
      console.error('Unsuspend error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const openDetail = (organizer: Organizer) => {
    setSelectedOrganizer(organizer)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Organizers</h1>
        <p className="text-muted-foreground mt-1">Manage self-signup organizer accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizers..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filters.verified || 'all'}
          onChange={(e) => handleFilterChange('verified', e.target.value)}
          className="px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm"
        >
          <option value="all">All</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Organizer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Handle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Followers</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {organizers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
                      <UserCog size={20} className="text-muted-foreground" />
                    </div>
                    <p>No organizers found.</p>
                  </td>
                </tr>
              ) : (
                organizers.map((org) => (
                  <tr key={org.profile_id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-sm">
                              {(org.organizer_name || 'O').charAt(0)}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <Link href={`/organizers/${org.profile_id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                            {org.organizer_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{org.profiles[0]?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">@{org.organizer_handle}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {org.verified ? (
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                            <ShieldCheck size={10} className="mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <Shield size={10} className="mr-1" />
                            Unverified
                          </Badge>
                        )}
                        {org.profiles[0]?.suspended && (
                          <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        {org.follower_count}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(org)}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                          title="View Details"
                        >
                          <Globe size={14} />
                        </button>
                        {org.verified ? (
                          <button
                            onClick={() => handleUnverify(org.profile_id)}
                            className="p-1.5 text-muted-foreground hover:text-warning transition-colors rounded"
                            title="Unverify"
                          >
                            <Shield size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(org.profile_id)}
                            className="p-1.5 text-muted-foreground hover:text-success transition-colors rounded"
                            title="Verify"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        )}
                        {org.profiles[0]?.suspended ? (
                          <button
                            onClick={() => handleUnsuspend(org.profile_id)}
                            className="p-1.5 text-muted-foreground hover:text-success transition-colors rounded"
                            title="Unsuspend"
                          >
                            <CheckCircle size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(org.profile_id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                            title="Suspend"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
            <p className="text-sm text-muted-foreground">
              Showing {((filters.page || 1) - 1) * perPage + 1} - {Math.min((filters.page || 1) * perPage, count)} of {count}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={(filters.page || 1) <= 1}
                className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium">
                {filters.page || 1} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={(filters.page || 1) >= totalPages}
                className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Organizer Details</DialogTitle>
          </DialogHeader>
          {selectedOrganizer && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14">
                  {selectedOrganizer.logo_url ? (
                    <img src={selectedOrganizer.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-lg">
                      {(selectedOrganizer.organizer_name || 'O').charAt(0)}
                    </div>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground">{selectedOrganizer.organizer_name}</h3>
                  <p className="text-sm text-muted-foreground">@{selectedOrganizer.organizer_handle}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{selectedOrganizer.bio || 'No bio provided.'}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} />
                  {selectedOrganizer.contact_email || selectedOrganizer.profiles[0]?.email}
                </div>
                {selectedOrganizer.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe size={14} />
                    {selectedOrganizer.website}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users size={14} />
                  {selectedOrganizer.follower_count} followers
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={14} />
                  Joined {format(new Date(selectedOrganizer.created_at), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {selectedOrganizer.verified ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">Verified</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
                {selectedOrganizer.profiles[0]?.suspended && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
