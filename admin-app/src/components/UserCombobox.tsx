'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, UserX } from 'lucide-react'
import { getUsers } from '@/lib/actions/users'
import type { MappedUser } from '@/lib/mappers'
import { UserAvatar } from '@/components/list/UserAvatar'
import { cn } from '@/lib/utils'

interface UserComboboxProps {
  value: string | null
  onChange: (profileId: string | null) => void
  placeholder?: string
}

export function UserCombobox({
  value,
  onChange,
  placeholder = 'Select a user…',
}: UserComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<MappedUser[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = users?.find((u) => u.profileId === value) ?? null

  const openDropdown = async () => {
    setOpen(true)
    if (users === null) {
      setLoading(true)
      try {
        const res = await getUsers({ status: 'all' })
        setUsers(res.users)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    setHighlighted(0)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const list = users ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    )
  }, [users, query])

  const visible = filtered.length > 0

  const pick = (u: MappedUser) => {
    onChange(u.profileId)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && visible) {
      e.preventDefault()
      const current = filtered[Math.min(highlighted, filtered.length - 1)]
      if (current?.profileId) pick(current)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm text-left hover:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <UserAvatar
              src={selected.avatar_url}
              fallback={selected.full_name || selected.username}
              size="sm"
            />
            <span className="truncate">
              <span className="block font-medium text-foreground leading-tight truncate">
                {selected.full_name || selected.username}
              </span>
              <span className="block text-xs text-muted-foreground truncate">{selected.email}</span>
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
        <ChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-outline-variant bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-outline-variant px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlighted(0)
              }}
              onKeyDown={onKeyDown}
              placeholder="Search by name or email…"
              aria-label="Search users"
              autoFocus
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul role="listbox" aria-label="Users" className="max-h-64 overflow-y-auto py-1">
            {loading && <li className="px-3 py-2 text-sm text-muted-foreground">Loading users…</li>}
            {!loading && filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">No users match.</li>
            )}
            {!loading &&
              filtered.map((u, i) => {
                const disabled = !u.profileId
                const active = i === Math.min(highlighted, filtered.length - 1)
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={u.profileId === value}
                      disabled={disabled}
                      onClick={() => u.profileId && pick(u)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left text-sm',
                        active ? 'bg-surface-container-high' : '',
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                      )}
                    >
                      <UserAvatar
                        src={u.avatar_url}
                        fallback={u.full_name || u.username}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-foreground leading-tight truncate">
                          {u.full_name || u.username}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {u.email}
                        </span>
                      </span>
                      {disabled && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserX size={12} />
                          No profile
                        </span>
                      )}
                      {u.profileId === value && (
                        <Check size={14} className="shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                )
              })}
          </ul>
        </div>
      )}
    </div>
  )
}
