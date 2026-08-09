'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
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
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/Page'
import {
  DataTable,
  FilterSelect,
  Pagination,
  SearchInput,
  StatusBadge,
  useListFilters,
  EmptyState,
} from '@/components/list'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useHosts, hostsKeys } from '@/lib/api/hosts'
import { createHost, updateHost, updateHostStatus, deleteHost } from '@/lib/actions/hosts'
import type { MappedHost } from '@/lib/mappers'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
]

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'registered_org', label: 'Registered Org' },
  { value: 'community_organizer', label: 'Community' },
  { value: 'venue', label: 'Venue' },
]

const statusVariants = {
  active: 'success',
  suspended: 'destructive',
  archived: 'outline',
} as const

interface HostForm {
  name: string
  slug: string
  host_type: string
  description: string
  contact_email: string
  contact_phone: string
  website: string
  location_text: string
  logo_url: string
}

const emptyForm: HostForm = {
  name: '',
  slug: '',
  host_type: 'venue',
  description: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  location_text: '',
  logo_url: '',
}

interface HostsClientProps {
  initialHosts: MappedHost[]
  initialCount: number
  initialFilters: { status?: string; type?: string; search?: string; page?: number }
}

export function HostsClient({ initialHosts, initialCount, initialFilters }: HostsClientProps) {
  const queryClient = useQueryClient()
  const { filters, update, setPage, searchInput, setSearchInput } = useListFilters({
    basePath: '/hosts',
    initial: initialFilters,
    defaults: { status: 'all', type: 'all', page: 1 },
  })

  const { data, isFetching } = useHosts(filters, { hosts: initialHosts, count: initialCount }, initialFilters)
  const hosts = data?.items ?? []
  const count = data?.total ?? 0
  const totalPages = Math.ceil(count / 20)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<MappedHost | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<HostForm>(emptyForm)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: hostsKeys })

  const openCreateDialog = () => {
    setEditingHost(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (host: MappedHost) => {
    setEditingHost(host)
    setForm({
      name: host.name,
      slug: host.slug,
      host_type: host.host_type,
      description: host.description,
      contact_email: host.contact_email || '',
      contact_phone: host.contact_phone || '',
      website: host.website || '',
      location_text: host.location_text,
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
        toast.success('Host updated')
      } else {
        await createHost(form)
        toast.success('Host created')
      }
      setIsDialogOpen(false)
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save host'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (hostId: string) => {
    setDeleteTarget(null)
    setIsLoading(true)
    try {
      await deleteHost(hostId)
      toast.success('Host deleted')
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete host'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (hostId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      await updateHostStatus(hostId, newStatus, newStatus === 'suspended' ? 'suspend_host' : 'unsuspend_host')
      toast.success(`Host ${newStatus}`)
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update host'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Hosts"
          description="Manage admin-created host profiles."
          actions={
            <Button onClick={openCreateDialog}>
              <Plus size={16} />
              Create Host
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search hosts..."
            className="flex-1 max-w-md"
          />
          <FilterSelect value={filters.status ?? 'all'} onChange={(v) => update('status', v)} options={statusOptions} />
          <FilterSelect value={filters.type ?? 'all'} onChange={(v) => update('type', v)} options={typeOptions} />
        </div>

        <DataTable<MappedHost>
          data={hosts}
          rowKey={(host) => host.id}
          loading={isFetching || isLoading}
          empty={
            <EmptyState icon={Building2} title="No hosts found." description="Try adjusting your search or filters." />
          }
          footer={
            <Pagination page={filters.page ?? 1} totalPages={totalPages} count={count} onPageChange={setPage} />
          }
          columns={[
            {
              key: 'host',
              header: 'Host',
              render: (host) => (
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
              ),
            },
            {
              key: 'type',
              header: 'Type',
              render: (host) => (
                <Badge variant="outline" className="text-xs">
                  {host.host_type.replace(/_/g, ' ')}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (host) => (
                <div className="flex items-center gap-1">
                  <StatusBadge
                    value={host.status}
                    variants={statusVariants}
                    labels={{ active: 'Active', suspended: 'Suspended', archived: 'Archived' }}
                  />
                  {host.verified && (
                    <Badge className="ml-1 text-xs bg-primary/10 text-primary border-primary/20">
                      <ShieldCheck size={10} className="mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'followers',
              header: 'Followers',
              render: (host) => (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users size={14} />
                  {host.follower_count}
                </span>
              ),
            },
            {
              key: 'created',
              header: 'Created',
              render: (host) => <span className="text-sm text-muted-foreground">{formatDate(host.created_at)}</span>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (host) => (
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
                      onClick={() => handleStatusChange(host.id, 'suspended')}
                      className="p-1.5 text-muted-foreground hover:text-warning transition-colors rounded"
                      title="Suspend"
                    >
                      <Shield size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(host.id, 'active')}
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
              ),
            },
          ]}
        />
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
              <Select value={form.host_type} onChange={(e) => setForm({ ...form, host_type: e.target.value })}>
                <option value="registered_org">Registered Org</option>
                <option value="community_organizer">Community Organizer</option>
                <option value="venue">Venue</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingHost ? 'Update Host' : 'Create Host'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
