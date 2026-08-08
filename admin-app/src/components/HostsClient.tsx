'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Search,
  Plus,
  Building2,
  CheckCircle,
  Shield,
  ShieldCheck,
  Trash2,
  Edit,
  Eye,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { createHost, updateHost, updateHostStatus, deleteHost } from '@/lib/actions/hosts'
import { useRouter } from 'next/navigation'

const hostTypeLabels: Record<string, string> = {
  registered_org: 'Registered Org',
  community_organizer: 'Community',
  venue: 'Venue',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
}

interface Host {
  id: string
  name: string
  slug: string
  host_type: string
  description: string
  contact_email?: string
  contact_phone?: string
  website?: string
  location_text?: string
  logo_url?: string
  verified: boolean
  status: string
  follower_count: number
  created_at: string
  updated_at: string
}

interface HostsClientProps {
  initialHosts: Host[]
  initialCount: number
  initialFilters: { status?: string; type?: string; search?: string; page?: number }
}

export function HostsClient({ initialHosts, initialCount, initialFilters }: HostsClientProps) {
  const [hosts, setHosts] = useState(initialHosts)
  const [count, setCount] = useState(initialCount)
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.search || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    host_type: 'venue',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    location_text: '',
    logo_url: '',
  })
  const router = useRouter()

  useEffect(() => {
    setHosts(initialHosts)
    setCount(initialCount)
    setFilters(initialFilters)
    setSearchInput(initialFilters.search || '')
  }, [initialHosts, initialCount, initialFilters])

  const perPage = 20
  const totalPages = Math.ceil(count / perPage)

  useEffect(() => {
    if (searchInput === (filters.search || '')) return
    const t = setTimeout(() => {
      const next = { ...filters, search: searchInput || undefined, page: 1 }
      setFilters(next)
      router.push(`/hosts?${new URLSearchParams(next as any).toString()}`)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, filters, router])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    router.push(`/hosts?${new URLSearchParams(newFilters as any).toString()}`)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    router.push(`/hosts?${new URLSearchParams(newFilters as any).toString()}`)
  }

  const openCreateDialog = () => {
    setEditingHost(null)
    setForm({
      name: '',
      slug: '',
      host_type: 'venue',
      description: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      location_text: '',
      logo_url: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (host: Host) => {
    setEditingHost(host)
    setForm({
      name: host.name,
      slug: host.slug,
      host_type: host.host_type,
      description: host.description,
      contact_email: host.contact_email || '',
      contact_phone: host.contact_phone || '',
      website: host.website || '',
      location_text: host.location_text || '',
      logo_url: host.logo_url || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (editingHost) {
        await updateHost(editingHost.id, {
          name: form.name,
          slug: form.slug,
          host_type: form.host_type,
          description: form.description,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          website: form.website,
          location_text: form.location_text,
          logo_url: form.logo_url,
        })
      } else {
        await createHost(form)
      }
      setIsDialogOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Host save error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (hostId: string) => {
    setDeleteTarget(null)
    setIsLoading(true)
    try {
      await deleteHost(hostId)
      router.refresh()
    } catch (err) {
      console.error('Host delete error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (hostId: string, newStatus: string, action: string) => {
    setIsLoading(true)
    try {
      await updateHostStatus(hostId, newStatus, action)
      router.refresh()
    } catch (err) {
      console.error('Host status error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">Hosts</h1>
          <p className="text-muted-foreground mt-1">Manage admin-created host profiles.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus size={16} className="mr-2" />
          Create Host
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hosts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filters.status || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filters.type || 'all'}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm"
        >
          <option value="all">All Types</option>
          <option value="registered_org">Registered Org</option>
          <option value="community_organizer">Community</option>
          <option value="venue">Venue</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Host</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Followers</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {hosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
                      <Building2 size={20} className="text-muted-foreground" />
                    </div>
                    <p>No hosts found.</p>
                  </td>
                </tr>
              ) : (
                hosts.map((host) => (
                  <tr key={host.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                          {host.logo_url ? (
                            <img src={host.logo_url} alt="" width={40} height={40} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={18} className="text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Link href={`/hosts/${host.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                            {host.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">@{host.slug}</p>
                          {host.location_text && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {host.location_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {hostTypeLabels[host.host_type] || host.host_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-xs ${
                          host.status === 'active'
                            ? 'bg-success/10 text-success border-success/20'
                            : host.status === 'suspended'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {statusLabels[host.status] || host.status}
                      </Badge>
                      {host.verified && (
                        <Badge className="ml-1 text-xs bg-primary/10 text-primary border-primary/20">
                          <ShieldCheck size={10} className="mr-1" />
                          Verified
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        {host.follower_count}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(host.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/hosts/${host.id}`}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                          title="View Profile"
                        >
                          <Eye size={14} />
                        </Link>
                        {host.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(host.id, 'suspended', 'suspend_host')}
                            className="p-1.5 text-muted-foreground hover:text-warning transition-colors rounded"
                            title="Suspend"
                          >
                            <Shield size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(host.id, 'active', 'unsuspend_host')}
                            className="p-1.5 text-muted-foreground hover:text-success transition-colors rounded"
                            title="Unsuspend"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditDialog(host)}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(host.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-semibold text-foreground">
              {editingHost ? 'Edit Host' : 'Create Host'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Host name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="host-slug"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={form.host_type}
                onChange={(e) => setForm({ ...form, host_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm"
              >
                <option value="registered_org">Registered Org</option>
                <option value="community_organizer">Community Organizer</option>
                <option value="venue">Venue</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm min-h-[80px] resize-none"
                placeholder="Host description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="contact@host.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="+1 234 567 890"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://host.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.location_text}
                    onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                    placeholder="City, Country"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo URL</label>
              <Input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? 'Saving...' : editingHost ? 'Update Host' : 'Create Host'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    <ConfirmDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}
      title="Delete host?"
      description="Are you sure you want to delete this host?"
      confirmLabel="Delete"
      destructive
      loading={isLoading}
      onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
    />
    </>
  )
}
