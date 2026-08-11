'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/errors'
import type { MappedReport } from '@/lib/mappers'
import {
  Flag,
  MessageSquare,
  User,
  Building2,
  Calendar,
  X,
  AlertTriangle,
  EyeOff,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { Button, Badge, Textarea } from '@/components/ui'
import { PageHeader, StatsCard } from '@/components/shared/PageLayout'
import { FilterSelect, UserAvatar, useListFilters, EmptyState } from '@/components/list'
import { formatDateTime } from '@/lib/format'
import { toast } from 'sonner'
import {
  dismissReport,
  warnUserFromReport,
  suspendUserFromReport,
  hideEventFromReport,
  deleteCommentFromReport,
  saveReportNote,
  getReportTargetPreview,
} from '@/lib/actions/reports'
import { useReports, reportsKeys } from '@/lib/api/reports'
import type { ReportListFilters } from '@/lib/api/reports'

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'actioned', label: 'Actioned' },
  { value: 'dismissed', label: 'Dismissed' },
]

const targetTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'event', label: 'Event' },
  { value: 'host', label: 'Host' },
  { value: 'user', label: 'User' },
  { value: 'comment', label: 'Comment' },
]

const statusBadgeStyles: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  reviewed: 'bg-muted text-muted-foreground',
  actioned: 'bg-destructive/10 text-destructive border-destructive/20',
  dismissed: 'bg-success/10 text-success border-success/20',
}

const targetTypeIcons: Record<string, LucideIcon> = {
  event: Calendar,
  host: Building2,
  user: User,
  comment: MessageSquare,
}

export function ReportsClient({
  initialReports,
  initialCount,
  initialFilters,
}: {
  initialReports: MappedReport[]
  initialCount: number
  initialFilters: ReportListFilters
}) {
  const queryClient = useQueryClient()
  const { filters, update } = useListFilters<ReportListFilters>({
    basePath: '/reports',
    initial: initialFilters,
    defaults: { status: 'all', targetType: 'all' },
  })

  const { data, isFetching } = useReports(
    filters,
    { reports: initialReports, count: initialCount },
    initialFilters,
  )
  const reports = data?.all ?? []
  const count = data?.total ?? 0

  const [selectedReport, setSelectedReport] = useState<MappedReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [targetPreview, setTargetPreview] = useState<Awaited<
    ReturnType<typeof getReportTargetPreview>
  > | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: reportsKeys })
  }

  const handleSelectReport = async (report: MappedReport) => {
    setSelectedReport(report)
    setNoteDraft(report.admin_note || '')
    setTargetPreview(null)
    try {
      const preview = await getReportTargetPreview(report.target_type, report.target_id)
      setTargetPreview(preview)
    } catch {
      setTargetPreview(null)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedReport) return
    try {
      setLoading(true)
      await saveReportNote(selectedReport.id, noteDraft)
      setSelectedReport({ ...selectedReport, admin_note: noteDraft })
      await refresh()
      toast.success('Note saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save note'))
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (!selectedReport) return
    try {
      setLoading(true)
      await dismissReport(selectedReport.id)
      await refresh()
      toast.success('Report dismissed')
      setSelectedReport(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to dismiss'))
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    if (!selectedReport) return
    try {
      setLoading(true)
      if (action === 'warn_user') {
        await warnUserFromReport(selectedReport.target_id, selectedReport.id)
      } else if (action === 'suspend_user') {
        await suspendUserFromReport(selectedReport.target_id, selectedReport.id)
      } else if (action === 'hide_event') {
        await hideEventFromReport(selectedReport.target_id, selectedReport.id)
      } else if (action === 'delete_comment') {
        await deleteCommentFromReport(selectedReport.target_id, selectedReport.id)
      }
      await refresh()
      toast.success('Action taken successfully')
      setSelectedReport(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Moderation"
        description="Manage user-submitted flags and maintain community guidelines."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={Flag} label="Total Reports" value={count} />
        <StatsCard
          icon={AlertTriangle}
          label="Pending"
          value={reports.filter((r) => r.status === 'pending').length}
        />
        <StatsCard
          icon={EyeOff}
          label="Actioned"
          value={reports.filter((r) => r.status === 'actioned').length}
        />
        <StatsCard
          icon={X}
          label="Dismissed"
          value={reports.filter((r) => r.status === 'dismissed').length}
        />
      </div>

      <div className="bg-card rounded-3xl border border-outline-variant overflow-hidden shadow-sm flex flex-col lg:flex-row h-[700px]">
        <div className="flex-1 overflow-auto border-r border-outline-variant">
          <div className="sticky top-0 bg-surface-container-lowest z-10 px-6 py-4 border-b border-outline-variant flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              {statusOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => update('status', o.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold transition-colors',
                    filters.status === o.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-surface-container',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <FilterSelect
                value={filters.targetType ?? 'all'}
                onChange={(v) => update('targetType', v)}
                options={targetTypeOptions}
                className="bg-surface-container-high border-none rounded-lg text-sm"
              />
            </div>
          </div>

          <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
            <table className="w-full text-left">
              <thead className="sticky top-[73px] bg-card z-10">
                <tr className="text-muted-foreground border-b border-outline-variant">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12">
                      <EmptyState
                        icon={Flag}
                        title="No reports found."
                        description="Try adjusting your filters."
                      />
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const TargetIcon = targetTypeIcons[report.target_type] || Flag
                    return (
                      <tr
                        key={report.id}
                        onClick={() => handleSelectReport(report)}
                        className={cn(
                          'hover:bg-surface-container-low cursor-pointer transition-colors',
                          selectedReport?.id === report.id && 'bg-surface-container-high',
                        )}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={report.profiles?.avatar_url}
                              fallback={(
                                report.profiles?.full_name ||
                                report.profiles?.username ||
                                'U'
                              ).charAt(0)}
                              size="sm"
                            />
                            <span className="font-semibold text-sm">
                              {report.profiles?.full_name || report.profiles?.username || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center text-muted-foreground">
                              <TargetIcon size={14} />
                            </div>
                            <span className="text-sm capitalize">{report.target_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm">{report.reason}</span>
                        </td>
                        <td className="px-6 py-5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-bold',
                              statusBadgeStyles[report.status] || 'bg-muted',
                            )}
                          >
                            {report.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right text-sm text-muted-foreground">
                          {formatDateTime(report.created_at)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={cn(
            'w-full lg:w-[400px] flex flex-col bg-surface-container-low h-full overflow-hidden transition-all duration-300 border-l border-outline-variant',
            selectedReport ? 'block' : 'hidden lg:flex',
          )}
        >
          {selectedReport ? (
            <>
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-card">
                <h3 className="font-headline text-lg font-semibold text-foreground">
                  Report Details
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="lg:hidden text-muted-foreground"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-card p-4 rounded-2xl border border-outline-variant">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">
                    Reporter
                  </p>
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      src={selectedReport.profiles?.avatar_url}
                      fallback={(selectedReport.profiles?.full_name || 'U').charAt(0)}
                      size="lg"
                    />
                    <div>
                      <p className="font-bold text-sm">
                        {selectedReport.profiles?.full_name ||
                          selectedReport.profiles?.username ||
                          'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported {formatDateTime(selectedReport.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">
                    Incident Summary
                  </p>
                  <div className="bg-card rounded-2xl border border-outline-variant overflow-hidden">
                    <div className="flex justify-between px-4 py-3 border-b border-outline-variant border-dashed">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="font-bold text-sm capitalize">
                        {selectedReport.target_type}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-3 border-b border-outline-variant border-dashed">
                      <span className="text-sm text-muted-foreground">Reason</span>
                      <span className="font-bold text-sm text-destructive">
                        {selectedReport.reason}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Date reported</span>
                      <span className="text-sm">{formatDateTime(selectedReport.created_at)}</span>
                    </div>
                  </div>
                </div>

                {targetPreview && (
                  <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-dashed border-outline">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">
                      Reported Content
                    </p>
                    <div className="bg-card p-4 rounded-xl shadow-sm border border-outline-variant">
                      {targetPreview.target_type === 'comment' && (
                        <p className="italic text-sm text-foreground">
                          &ldquo;{targetPreview.content}&rdquo;
                        </p>
                      )}
                      {targetPreview.target_type === 'event' && (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden">
                            {targetPreview.poster_url ? (
                              <img
                                src={targetPreview.poster_url}
                                alt=""
                                width={48}
                                height={48}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Calendar size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{targetPreview.title}</p>
                            <p className="text-xs text-muted-foreground">{targetPreview.status}</p>
                          </div>
                        </div>
                      )}
                      {targetPreview.target_type === 'user' && (
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={targetPreview.avatar_url}
                            fallback={(
                              targetPreview.full_name ||
                              targetPreview.username ||
                              'U'
                            ).charAt(0)}
                          />
                          <div>
                            <p className="font-semibold text-sm">
                              {targetPreview.full_name || targetPreview.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{targetPreview.username}
                            </p>
                          </div>
                        </div>
                      )}
                      {targetPreview.target_type === 'host' && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden">
                            {targetPreview.logo_url ? (
                              <img
                                src={targetPreview.logo_url}
                                alt=""
                                width={40}
                                height={40}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{targetPreview.name}</p>
                            <p className="text-xs text-muted-foreground">{targetPreview.status}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">
                    Moderator Notes
                  </p>
                  <Textarea
                    className="min-h-[80px] rounded-xl"
                    placeholder="Add a note about this decision..."
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="mt-2 h-8 text-xs"
                    onClick={handleSaveNote}
                    disabled={loading}
                  >
                    Save Note
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-card border-t border-outline-variant grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={handleDismiss}
                  disabled={loading}
                >
                  <X size={16} className="mr-1" />
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  className="h-10 border-warning text-warning hover:bg-warning/10"
                  onClick={() => handleAction('warn_user')}
                  disabled={loading || selectedReport.target_type !== 'user'}
                >
                  <TriangleAlert size={16} className="mr-1" />
                  Warn User
                </Button>
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => handleAction('hide_event')}
                  disabled={loading || selectedReport.target_type !== 'event'}
                >
                  <EyeOff size={16} className="mr-1" />
                  Hide Event
                </Button>
                <Button
                  className="h-10 bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    if (selectedReport.target_type === 'comment') handleAction('delete_comment')
                    else if (selectedReport.target_type === 'user') handleAction('suspend_user')
                  }}
                  disabled={
                    loading ||
                    (selectedReport.target_type !== 'comment' &&
                      selectedReport.target_type !== 'user')
                  }
                >
                  <Trash2 size={16} className="mr-1" />
                  {selectedReport.target_type === 'comment' ? 'Delete' : 'Suspend'}
                </Button>
              </div>
              {selectedReport.target_type === 'host' && (
                <p className="px-6 pb-4 text-xs text-muted-foreground">
                  Host moderation is not supported yet — dismiss this report instead.
                </p>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                  <Flag size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm">Select a report to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
