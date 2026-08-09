'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  Users,
  Eye,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader, StatsCard } from '@/components/Page'
import {
  DataTable,
  FilterSelect,
  Pagination,
  SearchInput,
  StatusBadge,
  UserAvatar,
  useListFilters,
  EmptyState,
} from '@/components/list'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useUsers, usersKeys } from '@/lib/api/users'
import type { UserListFilters } from '@/lib/api/users'
import { suspendUser, unsuspendUser, banUser } from '@/lib/actions/users'
import type { MappedProfile } from '@/lib/mappers'

const statusOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const statusVariants = {
  active: 'success',
  suspended: 'destructive',
} as const

interface UsersClientProps {
  initialUsers: MappedProfile[]
  initialCount: number
  initialFilters: UserListFilters
  currentAdminId: string | null
}

export function UsersClient({ initialUsers, initialCount, initialFilters, currentAdminId }: UsersClientProps) {
  const queryClient = useQueryClient()
  const { filters, update, setPage, searchInput, setSearchInput } = useListFilters({
    basePath: '/users',
    initial: initialFilters,
    defaults: { status: 'all', page: 1 },
  })

  const { data, isFetching } = useUsers(filters, { users: initialUsers, count: initialCount }, initialFilters)
  const users = data?.items ?? []
  const all = data?.all ?? users
  const count = data?.total ?? 0
  const totalPages = Math.ceil(count / 20)

  const [confirmTarget, setConfirmTarget] = useState<{ type: 'suspend' | 'ban'; id: string } | null>(null)
  const [mutating, setMutating] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: usersKeys })

  const handleSuspend = async (userId: string) => {
    setMutating(true)
    try {
      await suspendUser(userId)
      await refresh()
    } catch (err) {
      throw err
    } finally {
      setMutating(false)
    }
  }

  const handleUnsuspend = async (userId: string) => {
    setMutating(true)
    try {
      await unsuspendUser(userId)
      await refresh()
    } catch (err) {
      throw err
    } finally {
      setMutating(false)
    }
  }

  const handleBan = async (userId: string) => {
    setMutating(true)
    try {
      await banUser(userId)
      await refresh()
    } catch (err) {
      throw err
    } finally {
      setMutating(false)
    }
  }

  const runAction = async (type: 'suspend' | 'unsuspend' | 'ban', userId: string) => {
    try {
      if (type === 'suspend') await handleSuspend(userId)
      else if (type === 'unsuspend') await handleUnsuspend(userId)
      else await handleBan(userId)
      toast.success(type === 'ban' ? 'User banned' : type === 'suspend' ? 'User suspended' : 'User unsuspended')
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${type} user`))
    }
    setConfirmTarget(null)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader title="Users" description="Manage platform users." />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard icon={Users} label="Total Users" value={count} />
          <StatsCard icon={CheckCircle} label="Active" value={all.filter((u) => !u.suspended).length} />
          <StatsCard icon={Shield} label="Suspended" value={all.filter((u) => u.suspended).length} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search users by name..." className="flex-1 max-w-md" />
          <FilterSelect value={filters.status ?? 'all'} onChange={(v) => update('status', v)} options={statusOptions} />
        </div>

        <DataTable<MappedProfile>
          data={users}
          rowKey={(user) => user.id}
          loading={isFetching || mutating}
          empty={<EmptyState icon={User} title="No users found." description="Try adjusting your search or filters." />}
          footer={
            <Pagination page={filters.page ?? 1} totalPages={totalPages} count={count} onPageChange={setPage} />
          }
          columns={[
            {
              key: 'user',
              header: 'User',
              render: (user) => (
                <div className="flex items-center gap-3">
                  <UserAvatar src={user.avatar_url} fallback={(user.full_name || user.username || 'U').charAt(0)} />
                  <div>
                    <Link href={`/users/${user.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                      {user.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'email',
              header: 'Email',
              render: (user) => <span className="text-sm text-muted-foreground">{user.email}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (user) => (
                <StatusBadge
                  value={user.suspended ? 'suspended' : 'active'}
                  variants={statusVariants}
                  labels={{ active: 'Active', suspended: 'Suspended' }}
                />
              ),
            },
            {
              key: 'joined',
              header: 'Joined',
              render: (user) => <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span>,
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              render: (user) => (
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/users/${user.id}`}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                    title="View Profile"
                  >
                    <Eye size={14} />
                  </Link>
                  {user.id === currentAdminId ? (
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded">
                      You
                    </span>
                  ) : user.suspended ? (
                    <button
                      onClick={() => runAction('unsuspend', user.id)}
                      className="p-1.5 text-muted-foreground hover:text-success transition-colors rounded"
                      title="Unsuspend"
                    >
                      <ShieldCheck size={14} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmTarget({ type: 'suspend', id: user.id })}
                        className="p-1.5 text-muted-foreground hover:text-warning transition-colors rounded"
                        title="Suspend"
                      >
                        <Shield size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmTarget({ type: 'ban', id: user.id })}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                        title="Ban"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
        title={confirmTarget?.type === 'ban' ? 'Ban user?' : 'Suspend user?'}
        description={
          confirmTarget?.type === 'ban'
            ? 'Are you sure you want to ban this user? This will suspend their account.'
            : 'Are you sure you want to suspend this user?'
        }
        confirmLabel={confirmTarget?.type === 'ban' ? 'Ban' : 'Suspend'}
        destructive
        loading={mutating}
        onConfirm={() => {
          if (confirmTarget) runAction(confirmTarget.type, confirmTarget.id)
        }}
      />
    </>
  )
}
