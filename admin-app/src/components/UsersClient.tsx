'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Search,
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import { suspendUser, unsuspendUser, banUser } from '@/lib/actions/users'
import { useRouter } from 'next/navigation'

interface UserItem {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  suspended: boolean
  created_at: string
  updated_at: string
}

interface UsersClientProps {
  initialUsers: UserItem[]
  initialCount: number
  initialFilters: { status?: string; search?: string; page?: number }
}

export function UsersClient({ initialUsers, initialCount, initialFilters }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [count, setCount] = useState(initialCount)
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.search || '')
  const [, setIsLoading] = useState(false)
  const router = useRouter()
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'suspend' | 'ban'; id: string } | null>(null)

  useEffect(() => {
    setUsers(initialUsers)
    setCount(initialCount)
    setFilters(initialFilters)
    setSearchInput(initialFilters.search || '')
  }, [initialUsers, initialCount, initialFilters])

  const perPage = 20
  const totalPages = Math.ceil(count / perPage)

  useEffect(() => {
    if (searchInput === (filters.search || '')) return
    const t = setTimeout(() => {
      const next = { ...filters, search: searchInput || undefined, page: 1 }
      setFilters(next)
      router.push(`/users?${new URLSearchParams(Object.entries(next).map(([k, v]) => [k, String(v)])).toString()}`)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, filters, router])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    router.push(`/users?${new URLSearchParams(Object.entries(newFilters).map(([k, v]) => [k, String(v)])).toString()}`)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    router.push(`/users?${new URLSearchParams(Object.entries(newFilters).map(([k, v]) => [k, String(v)])).toString()}`)
  }

  const handleSuspend = async (userId: string) => {
    setIsLoading(true)
    try {
      await suspendUser(userId)
      router.refresh()
    } catch (err) {
      console.error('Suspend error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async (userId: string) => {
    setIsLoading(true)
    try {
      await unsuspendUser(userId)
      router.refresh()
    } catch (err) {
      console.error('Unsuspend error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBan = async (userId: string) => {
    setIsLoading(true)
    try {
      await banUser(userId)
      router.refresh()
    } catch (err) {
      console.error('Ban error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{count}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-tight">Total Users</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {users.filter((u) => !u.suspended).length}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-tight">Active</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {users.filter((u) => u.suspended).length}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-tight">Suspended</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name..."
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
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-high border-b border-outline-variant">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
                      <User size={20} className="text-muted-foreground" />
                    </div>
                    <p>No users found.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" width={40} height={40} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-sm">
                              {(user.full_name || user.username || 'U').charAt(0)}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <Link href={`/users/${user.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                            {user.full_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.suspended ? (
                        <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                          <Shield size={10} className="mr-1" />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-success/10 text-success border-success/20">
                          <CheckCircle size={10} className="mr-1" />
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/users/${user.id}`}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                          title="View Profile"
                        >
                          <Eye size={14} />
                        </Link>
                        {user.suspended ? (
                          <button
                            onClick={() => handleUnsuspend(user.id)}
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
      onConfirm={() => {
        if (confirmTarget?.type === 'ban') handleBan(confirmTarget.id)
        else if (confirmTarget?.type === 'suspend') handleSuspend(confirmTarget.id)
      }}
    />
    </>
  )
}
