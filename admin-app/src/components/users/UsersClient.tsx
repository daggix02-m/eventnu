'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldPlus,
  Users,
  UserX,
  Eye,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader, StatsCard } from '@/components/shared/PageLayout'
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
import { suspendUser, unsuspendUser, banUser, promoteUser, demoteUser } from '@/lib/actions/users'
import type { MappedUser } from '@/lib/mappers'

const statusOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'no_profile', label: 'No Profile' },
]

const statusVariants = {
  active: 'success',
  suspended: 'destructive',
} as const

const roleVariants = {
  admin: 'default',
  user: 'outline',
} as const

type ActionType = 'suspend' | 'unsuspend' | 'ban' | 'promote' | 'demote'

interface UsersClientProps {
  initialUsers: MappedUser[]
  initialCount: number
  initialFilters: UserListFilters
  currentAdminId: string | null
}

export function UsersClient({
  initialUsers,
  initialCount,
  initialFilters,
  currentAdminId,
}: UsersClientProps) {
  const queryClient = useQueryClient()
  const { filters, update, setPage, searchInput, setSearchInput } = useListFilters({
    basePath: '/users',
    initial: initialFilters,
    defaults: { status: 'all', page: 1 },
  })

  const { data, isFetching } = useUsers(
    filters,
    { users: initialUsers, count: initialCount },
    initialFilters,
  )
  const users = data?.items ?? []
  const all = data?.all ?? users
  const count = data?.total ?? 0
  const totalPages = Math.ceil(count / 20)

  const [confirmTarget, setConfirmTarget] = useState<{ type: ActionType; id: string } | null>(null)
  const [mutating, setMutating] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: usersKeys })

  const runAction = async (type: ActionType, userId: string) => {
    setMutating(true)
    try {
      if (type === 'suspend') await suspendUser(userId)
      else if (type === 'unsuspend') await unsuspendUser(userId)
      else if (type === 'ban') await banUser(userId)
      else if (type === 'promote') await promoteUser(userId)
      else await demoteUser(userId)
      await refresh()
      const messages: Record<ActionType, string> = {
        suspend: 'User suspended',
        unsuspend: 'User unsuspended',
        ban: 'User banned',
        promote: 'User promoted to admin',
        demote: 'Admin role removed',
      }
      toast.success(messages[type])
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${type} user`))
    } finally {
      setMutating(false)
    }
    setConfirmTarget(null)
  }

  const confirmDialog = confirmTarget
    ? {
        title:
          confirmTarget.type === 'ban'
            ? 'Ban user?'
            : confirmTarget.type === 'suspend'
              ? 'Suspend user?'
              : confirmTarget.type === 'promote'
                ? 'Make this user an admin?'
                : confirmTarget.type === 'demote'
                  ? 'Remove admin role?'
                  : 'Unsuspend user?',
        description:
          confirmTarget.type === 'ban'
            ? 'Are you sure you want to ban this user? This will suspend their account.'
            : confirmTarget.type === 'suspend'
              ? 'Are you sure you want to suspend this user?'
              : confirmTarget.type === 'promote'
                ? 'This will grant the user full admin access to the dashboard.'
                : confirmTarget.type === 'demote'
                  ? 'This will remove admin access from this user.'
                  : 'Are you sure you want to unsuspend this user?',
        confirmLabel:
          confirmTarget.type === 'promote'
            ? 'Make admin'
            : confirmTarget.type === 'demote'
              ? 'Remove admin'
              : confirmTarget.type === 'unsuspend'
                ? 'Unsuspend'
                : confirmTarget.type === 'ban'
                  ? 'Ban'
                  : 'Suspend',
        destructive: confirmTarget.type !== 'promote' && confirmTarget.type !== 'unsuspend',
      }
    : null

  return (
    <>
      <div className="space-y-6">
        <PageHeader title="Users" description="Manage platform users." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Users} label="Total Users" value={count} />
          <StatsCard
            icon={CheckCircle}
            label="Active"
            value={all.filter((u) => u.has_profile && !u.suspended).length}
          />
          <StatsCard
            icon={Shield}
            label="Suspended"
            value={all.filter((u) => u.suspended).length}
          />
          <StatsCard
            icon={UserX}
            label="No Profile"
            value={all.filter((u) => !u.has_profile).length}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search users by name..."
            className="flex-1 max-w-md"
          />
          <FilterSelect
            value={filters.status ?? 'all'}
            onChange={(v) => update('status', v)}
            options={statusOptions}
          />
        </div>

        <DataTable<MappedUser>
          data={users}
          rowKey={(user) => user.id}
          loading={isFetching || mutating}
          empty={
            <EmptyState
              icon={User}
              title="No users found."
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
              key: 'user',
              header: 'User',
              render: (user) => (
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={user.avatar_url}
                    fallback={(user.full_name || user.username || 'U').charAt(0)}
                  />
                  <div>
                    <Link
                      href={`/users/${user.id}`}
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {user.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                      {!user.has_profile && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning bg-warning/10 border border-warning/20 rounded">
                          No profile
                        </span>
                      )}
                    </p>
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
              key: 'role',
              header: 'Role',
              render: (user) => (
                <StatusBadge
                  value={user.role}
                  variants={roleVariants}
                  labels={{ admin: 'Admin', user: 'User' }}
                />
              ),
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
              render: (user) => (
                <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span>
              ),
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
                  ) : (
                    <>
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => setConfirmTarget({ type: 'demote', id: user.id })}
                          className="p-1.5 text-muted-foreground hover:text-warning transition-colors rounded"
                          title="Remove Admin"
                        >
                          <ShieldOff size={14} />
                        </button>
                      ) : user.has_profile ? (
                        <button
                          onClick={() => setConfirmTarget({ type: 'promote', id: user.id })}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                          title="Make Admin"
                        >
                          <ShieldPlus size={14} />
                        </button>
                      ) : null}
                      {user.suspended ? (
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
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel ?? 'Confirm'}
        destructive={confirmDialog?.destructive ?? false}
        loading={mutating}
        onConfirm={() => {
          if (confirmTarget) runAction(confirmTarget.type, confirmTarget.id)
        }}
      />
    </>
  )
}
