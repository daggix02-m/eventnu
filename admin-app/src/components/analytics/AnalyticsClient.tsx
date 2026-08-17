'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { Calendar, Users, UserCog, TrendingUp, Activity } from 'lucide-react'

interface AnalyticsData {
  eventsPerWeek: { week_start: string; event_count: number }[]
  usersPerWeek: { week_start: string; user_count: number }[]
  totalEvents: number
  totalUsers: number
  totalOrganizers: number
  topEvents: { id: string; title: string; like_count: number; start_date: string }[]
}

interface AnalyticsClientProps {
  data: AnalyticsData
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'users'>('overview')

  const eventsChartData = useMemo(
    () =>
      data.eventsPerWeek.map((item) => ({
        week: new Date(item.week_start).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        count: Number(item.event_count),
      })),
    [data.eventsPerWeek],
  )

  const usersChartData = useMemo(
    () =>
      data.usersPerWeek.map((item) => ({
        week: new Date(item.week_start).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        count: Number(item.user_count),
      })),
    [data.usersPerWeek],
  )

  const stats = [
    {
      label: 'Total Events',
      value: data.totalEvents,
      icon: Calendar,
    },
    {
      label: 'Total Users',
      value: data.totalUsers,
      icon: Users,
    },
    {
      label: 'Organizers',
      value: data.totalOrganizers,
      icon: UserCog,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Platform analytics and insights.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  {stat.label}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'events', label: 'Events', icon: Calendar },
          { key: 'users', label: 'Users', icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'overview' | 'events' | 'users')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center text-muted-foreground">
              <tab.icon size={14} />
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Events Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Events Over Time</h3>
                <p className="text-sm text-muted-foreground">
                  Published events per week (last 12 weeks)
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center text-muted-foreground">
                  <TrendingUp size={14} />
                </div>
                <span>Live data</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--outline-variant))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Users Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">User Growth</h3>
                <p className="text-sm text-muted-foreground">New users per week (last 12 weeks)</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center text-muted-foreground">
                  <TrendingUp size={14} />
                </div>
                <span>Live data</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--outline-variant))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Top Events by Likes</h3>
            <div className="space-y-3">
              {data.topEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No events data yet.</p>
              ) : (
                data.topEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp size={14} className="text-primary" />
                      {event.like_count} likes
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">User Growth Chart</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--outline-variant))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  )
}
