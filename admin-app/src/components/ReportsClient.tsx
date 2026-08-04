'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'
import { Button } from 'company-design-system'
import { Badge } from 'company-design-system'
import { Avatar } from 'company-design-system'
import { toast } from 'sonner'
import { dismissReport, warnUserFromReport, suspendUserFromReport, hideEventFromReport, deleteCommentFromReport, getReportTargetPreview } from '@/lib/actions/reports'

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

const targetTypeIcons: Record<string, any> = {
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
  initialReports: any[]
  initialCount: number
  initialFilters: any
}) {
  const [reports, setReports] = useState(initialReports)
  const [count, setCount] = useState(initialCount)
  const [filters, setFilters] = useState(initialFilters)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [targetPreview, setTargetPreview] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setReports(initialReports)
    setCount(initialCount)
    setFilters(initialFilters)
  }, [initialReports, initialCount, initialFilters])

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    const params = new URLSearchParams()
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status)
    if (newFilters.targetType && newFilters.targetType !== 'all') params.set('targetType', newFilters.targetType)
    if (newFilters.page) params.set('page', String(newFilters.page))
    const qs = params.toString()
    router.push(`/reports${qs ? `?${qs}` : ''}`)
  }

  const handleSelectReport = async (report: any) => {
    setSelectedReport(report)
    setTargetPreview(null)
    const preview = await getReportTargetPreview(report.target_type, report.target_id)
    setTargetPreview(preview)
  }

  const handleDismiss = async () => {
    if (!selectedReport) return
    try {
      setLoading(true)
      await dismissReport(selectedReport.id)
      toast.success('Report dismissed')
      setSelectedReport(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss')
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
      toast.success('Action taken successfully')
      setSelectedReport(null)
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Reports & Moderation</h1>
        <p className="text-muted-foreground mt-1">Manage user-submitted flags and maintain community guidelines.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reports', value: count, icon: Flag },
          { label: 'Pending', value: reports.filter((r: any) => r.status === 'pending').length, icon: AlertTriangle },
          { label: 'Actioned', value: reports.filter((r: any) => r.status === 'actioned').length, icon: EyeOff },
          { label: 'Dismissed', value: reports.filter((r: any) => r.status === 'dismissed').length, icon: X },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card p-6 rounded-2xl shadow-sm border border-outline-variant hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-xl w-fit mb-4 bg-surface-container-high text-muted-foreground">
              <stat.icon size={20} />
            </div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-bold tracking-tight text-primary">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Layout: Table + Detail Panel */}
      <div className="bg-card rounded-3xl border border-outline-variant overflow-hidden shadow-sm flex flex-col lg:flex-row h-[700px]">
        {/* Table */}
        <div className="flex-1 overflow-auto border-r border-outline-variant">
          {/* Filters */}
          <div className="sticky top-0 bg-surface-container-lowest z-10 px-6 py-4 border-b border-outline-variant flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              {statusOptions.map(o => (
                <button
                  key={o.value}
                  onClick={() => updateFilter('status', o.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold transition-colors',
                    filters.status === o.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-surface-container'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={filters.targetType || 'all'}
                onChange={(e) => updateFilter('targetType', e.target.value)}
                className="bg-surface-container-high border-none rounded-lg px-3 py-2 text-sm focus:ring-0 outline-none"
              >
                {targetTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="sticky top-[73px] bg-card z-10">
              <tr className="text-muted-foreground border-b border-outline-variant">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No reports found matching your filters.
                  </td>
                </tr>
              ) : (
                reports.map((report: any) => {
                  const TargetIcon = targetTypeIcons[report.target_type] || Flag
                  return (
                    <tr
                      key={report.id}
                      onClick={() => handleSelectReport(report)}
                      className={cn(
                        'hover:bg-surface-container-low cursor-pointer transition-colors',
                        selectedReport?.id === report.id && 'bg-surface-container-high'
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {report.profiles?.avatar_url ? (
                              <img src={report.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-xs">
                                {(report.profiles?.full_name || report.profiles?.username || 'U').charAt(0)}
                              </div>
                            )}
                          </Avatar>
                          <span className="font-semibold text-sm">{report.profiles?.full_name || report.profiles?.username || 'Unknown'}</span>
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
                        <Badge variant="outline" className={cn('text-xs font-bold', statusBadgeStyles[report.status] || 'bg-muted')}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className={cn(
          'w-full lg:w-[400px] flex flex-col bg-surface-container-low h-full overflow-hidden transition-all duration-300 border-l border-outline-variant',
          selectedReport ? 'block' : 'hidden lg:flex'
        )}>
          {selectedReport ? (
            <>
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-card">
                <h3 className="text-lg font-bold text-primary">Report Details</h3>
                <button onClick={() => setSelectedReport(null)} className="lg:hidden text-muted-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Reporter Info */}
                <div className="bg-card p-4 rounded-2xl border border-outline-variant">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">Reporter</p>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      {selectedReport.profiles?.avatar_url ? (
                        <img src={selectedReport.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                               <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-lg">
                          {(selectedReport.profiles?.full_name || 'U').charAt(0)}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">{selectedReport.profiles?.full_name || selectedReport.profiles?.username || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">User since {new Date(selectedReport.created_at).getFullYear()}</p>
                    </div>
                  </div>
                </div>

                {/* Report Summary */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">Incident Summary</p>
                  <div className="bg-card rounded-2xl border border-outline-variant overflow-hidden">
                    <div className="flex justify-between px-4 py-3 border-b border-outline-variant border-dashed">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="font-bold text-sm capitalize">{selectedReport.target_type}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 border-b border-outline-variant border-dashed">
                      <span className="text-sm text-muted-foreground">Reason</span>
                      <span className="font-bold text-sm text-destructive">{selectedReport.reason}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Date reported</span>
                      <span className="text-sm">{new Date(selectedReport.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Target Preview */}
                {targetPreview && (
                  <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-dashed border-outline">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">Reported Content</p>
                    <div className="bg-card p-4 rounded-xl shadow-sm border border-outline-variant">
                      {selectedReport.target_type === 'comment' && (
                        <p className="italic text-sm text-foreground">&ldquo;{targetPreview.content}&rdquo;</p>
                      )}
                      {selectedReport.target_type === 'event' && (
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden">
                            {targetPreview.poster_url ? (
                              <img src={targetPreview.poster_url} alt="" className="w-full h-full object-cover" />
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
                      {selectedReport.target_type === 'user' && (
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            {targetPreview.avatar_url ? (
                              <img src={targetPreview.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-sm">
                                {(targetPreview.full_name || targetPreview.username || 'U').charAt(0)}
                              </div>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{targetPreview.full_name || targetPreview.username}</p>
                            <p className="text-xs text-muted-foreground">@{targetPreview.username}</p>
                          </div>
                        </div>
                      )}
                      {selectedReport.target_type === 'host' && (
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden">
                            {targetPreview.logo_url ? (
                              <img src={targetPreview.logo_url} alt="" className="w-full h-full object-cover" />
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

                {/* Moderator Notes */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">Moderator Notes</p>
                  <textarea
                    className="w-full bg-background border border-outline-variant rounded-xl p-3 text-sm focus:ring-primary focus:border-primary min-h-[80px] outline-none"
                    placeholder="Add a note about this decision..."
                    defaultValue={selectedReport.admin_note || ''}
                  />
                </div>
              </div>

              {/* Action Bar */}
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
                  disabled={loading}
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
                  Hide
                </Button>
                <Button
                  className="h-10 bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    if (selectedReport.target_type === 'comment') handleAction('delete_comment')
                    else if (selectedReport.target_type === 'user') handleAction('suspend_user')
                    else handleAction('hide_event')
                  }}
                  disabled={loading}
                >
                  <Trash2 size={16} className="mr-1" />
                  {selectedReport.target_type === 'comment' ? 'Delete' : selectedReport.target_type === 'user' ? 'Suspend' : 'Remove'}
                </Button>
              </div>
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
