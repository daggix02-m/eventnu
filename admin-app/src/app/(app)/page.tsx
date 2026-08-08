import { getDashboardStats, getPendingReviewEvents, getRecentModerationLogs } from '@/lib/actions/dashboard'
import { StatCard } from '@/components/StatCard'
import { PageWrapper, PageHeader } from '@/components/Page'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Calendar,
  CalendarDays,
  Clock,
  Building2,
  Users,
  Flag,
  ArrowRight,
  Activity,
} from 'lucide-react'

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const pendingEvents = await getPendingReviewEvents()
  const moderationLogs = await getRecentModerationLogs()

  const isEmpty =
    stats.totalPublished === 0 &&
    stats.upcomingCount === 0 &&
    stats.pendingReview === 0 &&
    stats.activeHosts === 0 &&
    stats.totalUsers === 0 &&
    stats.openReports === 0

  const statCards = [
    {
      label: 'Total Published',
      value: stats.totalPublished,
      icon: Calendar,
      trend: null,
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingCount,
      icon: CalendarDays,
      trend: null,
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      highlight: stats.pendingReview > 0,
      trend: null,
    },
    {
      label: 'Active Hosts',
      value: stats.activeHosts,
      icon: Building2,
      trend: null,
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      trend: null,
    },
    {
      label: 'Open Reports',
      value: stats.openReports,
      icon: Flag,
      highlight: stats.openReports > 0,
      trend: null,
    },
  ]

  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Real-time overview of platform health."
        folio="Index · 01 / 2026"
      />

      {isEmpty ? (
        <div className="bg-card rounded-2xl border border-outline-variant p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-muted-foreground" />
          </div>
          <h2 className="font-headline text-xl font-semibold text-foreground mb-2">Welcome to Event Nu Admin</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Your platform is brand new. Events, users, and reports will appear here as the platform grows.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/events/new">
              <Button>
                <Calendar size={16} className="mr-2" />
                Create First Event
              </Button>
            </Link>
          </div>
          <div className="mt-8 text-left max-w-md mx-auto space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Getting started checklist:</h3>
            <div className="space-y-2">
              {['Create an event', 'Set up host profiles', 'Review submitted events', 'Configure featured sections'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-md border border-outline-variant flex items-center justify-center font-mono text-[10px]">
                    {i + 1}
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, i) => (
              <StatCard key={stat.label} {...stat} delay={i * 0.04} />
            ))}
          </div>

          {/* Pending Review Queue */}
          {stats.pendingReview > 0 && (
            <div className="bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
              <div className="p-6 border-b border-outline-variant flex items-center justify-between">
                <div>
                  <h2 className="font-headline text-lg font-semibold text-foreground">Pending Review Queue</h2>
                  <p className="text-sm text-muted-foreground">Events awaiting moderation approval</p>
                </div>
                <Link href="/events?status=pending_review">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y divide-outline-variant">
                {pendingEvents.map((event: any) => (
                  <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                      {event.poster_url ? (
                        <img src={event.poster_url} alt="" width={48} height={48} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Calendar size={18} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{event.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        by {event.organizer_id ? 'Organizer' : 'Unknown'} · {format(new Date(event.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moderation Activity Feed */}
          <div className="bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="font-headline text-lg font-semibold text-foreground">Recent Moderation Activity</h2>
              <p className="text-sm text-muted-foreground">Last 10 actions taken by the admin team</p>
            </div>
            <div className="divide-y divide-outline-variant">
              {moderationLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No moderation activity yet.
                </div>
              ) : (
                moderationLogs.map((log: any) => (
                  <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                    <Avatar className="w-8 h-8">
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-xs">
                        {(log.profiles?.full_name || 'A').charAt(0)}
                      </div>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{log.profiles?.full_name || 'Admin'}</span>{' '}
                        <span className="text-muted-foreground">
                          {log.action.replace(/_/g, ' ')}
                        </span>{' '}
                        <span className="font-medium">{log.target_type}</span>
                      </p>
                      {log.note && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{log.note}</p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
