'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapReport } from '../mappers'

export async function getReports(params: {
  status?: string
  targetType?: string
  page?: number
  perPage?: number
}) {
  try {
    const reports = await fetchQuery(api.reports.list, { status: params.status })
    let filtered = reports.map(mapReport)
    if (params.targetType && params.targetType !== 'all') {
      filtered = filtered.filter((r: any) => r.target_type === params.targetType)
    }
    return { reports: filtered, count: filtered.length }
  } catch (err) {
    console.error('Failed to load reports:', err)
    throw err
  }
}

export async function getReportTargetPreview(targetType: string, targetId: string) {
  try {
    return await fetchQuery(api.reports.getTargetPreview, { targetType, targetId })
  } catch (err) {
    console.error('Failed to load report target preview:', err)
    return null
  }
}

export async function dismissReport(reportId: string) {
  await fetchMutation(api.reports.dismiss, { reportId: reportId as any })
  revalidatePath('/reports')
}

async function actionReport(reportId: string, action: string, note?: string) {
  await fetchMutation(api.reports.actionReport, {
    reportId: reportId as any,
    action,
    note,
  })
  revalidatePath('/reports')
}

export async function warnUserFromReport(userId: string, reportId: string) {
  await fetchMutation(api.reports.warnUserFromReport, { profileId: userId as any })
  await actionReport(reportId, 'warn_user')
}

export async function suspendUserFromReport(userId: string, reportId: string) {
  await fetchMutation(api.reports.suspendUserFromReport, { profileId: userId as any })
  await actionReport(reportId, 'suspend_user')
}

export async function hideEventFromReport(eventId: string, reportId: string) {
  await fetchMutation(api.reports.hideEventFromReport, { eventId: eventId as any })
  await actionReport(reportId, 'hide_event')
}

export async function deleteCommentFromReport(commentId: string, reportId: string) {
  await fetchMutation(api.reports.deleteCommentFromReport, { commentId: commentId as any })
  await actionReport(reportId, 'delete_comment')
}

export async function saveReportNote(reportId: string, note?: string) {
  await fetchMutation(api.reports.updateNote, {
    reportId: reportId as any,
    note: note || undefined,
  })
  revalidatePath('/reports')
}
