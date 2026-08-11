'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapReport, mapReportTargetPreview } from '../mappers'

export async function getReports(params: {
  status?: string
  targetType?: string
  page?: number
  perPage?: number
}) {
  const reports = await fetchQuery(api.reports.list, {
    status: params.status !== 'all' ? params.status : undefined,
  })
  let filtered = reports.map(mapReport)
  if (params.targetType && params.targetType !== 'all') {
    filtered = filtered.filter((r) => r.target_type === params.targetType)
  }
  return { reports: filtered, count: filtered.length }
}

export async function getReportTargetPreview(targetType: string, targetId: string) {
  const preview = await fetchQuery(api.reports.getTargetPreview, { targetType, targetId })
  return mapReportTargetPreview(preview)
}

export async function dismissReport(reportId: string) {
  await fetchMutation(api.reports.dismiss, { reportId: reportId as Id<'reports'> })
  revalidatePath('/reports')
}

async function actionReport(reportId: string, action: string, note?: string) {
  await fetchMutation(api.reports.actionReport, {
    reportId: reportId as Id<'reports'>,
    action,
    note,
  })
  revalidatePath('/reports')
}

export async function warnUserFromReport(userId: string, reportId: string) {
  await fetchMutation(api.reports.warnUserFromReport, { profileId: userId as Id<'profiles'> })
  await actionReport(reportId, 'warn_user')
}

export async function suspendUserFromReport(userId: string, reportId: string) {
  await fetchMutation(api.reports.suspendUserFromReport, { profileId: userId as Id<'profiles'> })
  await actionReport(reportId, 'suspend_user')
}

export async function hideEventFromReport(eventId: string, reportId: string) {
  await fetchMutation(api.reports.hideEventFromReport, { eventId: eventId as Id<'events'> })
  await actionReport(reportId, 'hide_event')
}

export async function deleteCommentFromReport(commentId: string, reportId: string) {
  await fetchMutation(api.reports.deleteCommentFromReport, {
    commentId: commentId as Id<'eventComments'>,
  })
  await actionReport(reportId, 'delete_comment')
}

export async function saveReportNote(reportId: string, note?: string) {
  await fetchMutation(api.reports.updateNote, {
    reportId: reportId as Id<'reports'>,
    note: note || undefined,
  })
  revalidatePath('/reports')
}
