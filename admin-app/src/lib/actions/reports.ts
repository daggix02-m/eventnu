'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapReport, mapReportTargetPreview } from '../mappers'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export type ReportTargetType = 'event' | 'organizer' | 'host' | 'user' | 'comment'

export async function getReports(params: {
  status?: string
  targetType?: ReportTargetType | 'all'
  cursor?: string | null
}) {
  const result = await fetchQuery(api.reports.list, {
    paginationOpts: { numItems: DEFAULT_PAGE_SIZE, cursor: params.cursor ?? null },
    status: params.status !== 'all' ? params.status : undefined,
    targetType: params.targetType !== 'all' ? params.targetType : undefined,
  })
  return {
    items: (result.page ?? []).map(mapReport),
    nextCursor: (result.continueCursor ?? null) as string | null,
    isDone: result.isDone,
  }
}

export async function getReportsStats() {
  return await fetchQuery(api.reports.getStats)
}

export async function getReportTargetPreview(targetType: string, targetId: string) {
  const preview = await fetchQuery(api.reports.getTargetPreview, {
    targetType: targetType as ReportTargetType,
    targetId,
  })
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

export async function hideOrganizerFromReport(organizerId: string, reportId: string) {
  await fetchMutation(api.reports.hideOrganizerFromReport, {
    organizerId: organizerId as Id<'organizerProfiles'>,
  })
  await actionReport(reportId, 'hide_organizer')
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
