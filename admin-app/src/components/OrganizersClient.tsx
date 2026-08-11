'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  Globe,
  Mail,
  Users,
  UserCog,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/Page'
import {
  DataTable,
  FilterSelect,
  Pagination,
  SearchInput,
  UserAvatar,
  useListFilters,
  EmptyState,
} from '@/components/list'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useOrganizers, organizersKeys } from '@/lib/api/organizers'
import type { OrganizerListFilters } from '@/lib/api/organizers'
import {
  verifyOrganizer,
  unverifyOrganizer,
  suspendOrganizer,
  unsuspendOrganizer,
} from '@/lib/actions/organizers'
import type { MappedOrganizer } from '@/lib/mappers'

const verifiedOptions = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
]

interface OrganizersClientProps {
  initialOrganizers: MappedOrganizer[]
  initialCount: number
  initialFilters: OrganizerListFilters
}

export function OrganizersClient({
  initialOrganizers,
  initialCount,
  initialFilters,
}: OrganizersClientProps) {
  const queryClient = useQueryClient()
  const { filters, update, setPage, searchInput, setSearchInput } = useListFilters({
    basePath: '/organizers',
    initial: initialFilters,
    defaults: { verified: 'all', page: 1 },
  })

  const { data, isFetching } = useOrganizers(
    filters,
    { organizers: initialOrganizers, count: initialCount },
    initialFilters,
  )
  const organizers = data?.items ?? []
  const count = data?.total ?? 0
  const totalPages = Math.ceil(count / 20)

  const [selectedOrganizer, setSelectedOrganizer] = useState<MappedOrganizer | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [mutating, setMutating] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: organizersKeys })

  const runAction = async (
    action: 'verify' | 'unverify' | 'suspend' | 'unsuspend',
    profileId: string,
  ) => {
    setMutating(true)
    try {
      if (action === 'verify') await verifyOrganizer(profileId)
      else if (action === 'unverify') await unverifyOrganizer(profileId)
      else if (action === 'suspend') await suspendOrganizer(profileId)
      else await unsuspendOrganizer(profileId)
      await refresh()
      toast.success('Organizer updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setMutating(false)
    }
  }

  const openDetail = (organizer: MappedOrganizer) => {
    setSelectedOrganizer(organizer)
    setIsDetailOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader title="Organizers" description="Manage self-signup organizer accounts." />

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search organizers..."
            className="flex-1 max-w-md"
          />
          <FilterSelect
            value={filters.verified ?? 'all'}
            onChange={(v) => update('verified', v)}
            options={verifiedOptions}
          />
        </div>

        <DataTable<MappedOrganizer>
          data={organizers}
          rowKey={(organizer) => organizer.profile_id}
          loading={isFetching || mutating}
          empty={
            <EmptyState
              icon={UserCog}
              title="No organizers found."
              description="Try adjusting your search or filters."
            />
          }
          footer={
            <Pagination
              page={filters.page ?? 1}
              totalPages={totalPages}
              count={count}
              onPageChange={setPage}
            />
          }
          columns={[
            {
              key: 'organizer',
              header: 'Organizer',
              render: (org) => (
                <div className="flex items-center gap-3">
                  <UserAvatar src={org.logo_url} fallback={(org.organizer_name || 'O').charAt(0)} />
                  <div>
                    <Link
                      href={`/organizers/${org.profile_id}`}
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {org.organizer_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{org.profiles[0]?.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'handle',
              header: 'Handle',
              render: (org) => (
                <span className="text-sm text-muted-foreground">@{org.organizer_handle}</span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (org) => (
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
                    <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                      Suspended
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'followers',
              header: 'Followers',
              render: (org) => (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users size={14} />
                  {org.follower_count}
                </span>
              ),
            },
            {
              key: 'joined',
              header: 'Joined',
              render: (org) => (
                <span className="text-sm text-muted-foreground">{formatDate(org.created_at)}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (org) => (
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
                      onClick={() => runAction('unverify', org.profile_id)}
                      className="p-1.5 text-muted-foreground hover:text-warning transition-colors rounded"
                      title="Unverify"
                    >
                      <Shield size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => runAction('verify', org.profile_id)}
                      className="p-1.5 text-muted-foreground hover:text-success transition-colors rounded"
                      title="Verify"
                    >
                      <ShieldCheck size={14} />
                    </button>
                  )}
                  {org.profiles[0]?.suspended ? (
                    <button
                      onClick={() => runAction('unsuspend', org.profile_id)}
                      className="p-1.5 text-muted-foreground hover:text-success transition-colors rounded"
                      title="Unsuspend"
                    >
                      <CheckCircle size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => runAction('suspend', org.profile_id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                      title="Suspend"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-semibold text-foreground">
              Organizer Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrganizer && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={selectedOrganizer.logo_url}
                  fallback={(selectedOrganizer.organizer_name || 'O').charAt(0)}
                  size="lg"
                />
                <div>
                  <h3 className="font-bold text-foreground">{selectedOrganizer.organizer_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    @{selectedOrganizer.organizer_handle}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {selectedOrganizer.bio || 'No bio provided.'}
                </p>
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
                  Joined {formatDate(selectedOrganizer.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {selectedOrganizer.verified ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">Verified</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
                {selectedOrganizer.profiles[0]?.suspended && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                    Suspended
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
