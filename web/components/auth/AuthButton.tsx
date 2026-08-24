'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { LogOut, Bookmark, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { rememberAuthRedirect } from '@/lib/auth'

export function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const router = useRouter()
  const profile = useQuery(api.profiles.getMe)

  if (isLoading) {
    return <Skeleton className="h-11 w-24 rounded-xl" aria-hidden="true" />
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="min-h-11"
        onClick={() => {
          rememberAuthRedirect(window.location.pathname, window.location.search)
          router.push('/auth?mode=signin')
        }}
      >
        Sign in
      </Button>
    )
  }

  const initials = (profile?.fullName || profile?.email || 'U').trim().slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="Account menu"
        >
          <Avatar className="h-10 w-10">
            {profile?.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.fullName ?? 'Profile'} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-on-surface">{profile?.fullName || 'Account'}</p>
          {profile?.email && (
            <p className="truncate font-mono text-label-sm normal-case text-on-surface-variant">
              {profile.email}
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4" /> My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=bookmarks">
            <Bookmark className="h-4 w-4" /> Saved events
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
