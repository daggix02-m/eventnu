'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapHost } from '../mappers'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export async function getHosts(params: {
  status?: string
  type?: string
  search?: string
  cursor?: string | null
}) {
  const result = await fetchQuery(api.hosts.list, {
    paginationOpts: { numItems: DEFAULT_PAGE_SIZE, cursor: params.cursor ?? null },
    search: params.search,
    status: params.status !== 'all' ? params.status : undefined,
    hostType: params.type !== 'all' ? params.type : undefined,
  })
  return {
    items: (result.page ?? []).map(mapHost),
    nextCursor: (result.continueCursor ?? null) as string | null,
    isDone: result.isDone,
  }
}

export async function getAllHosts(params: { status?: string; type?: string } = {}) {
  const items: Awaited<ReturnType<typeof getHosts>>['items'] = []
  let cursor: string | null = null
  for (let i = 0; i < 50; i++) {
    const page = await getHosts({ status: params.status, type: params.type, cursor })
    items.push(...page.items)
    if (page.isDone || !page.nextCursor) break
    cursor = page.nextCursor
  }
  return items
}

export async function createHost(host: {
  name: string
  slug: string
  host_type: string
  description?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  location_text?: string
  logo_url?: string
}) {
  const result = await fetchMutation(api.hosts.create, {
    name: host.name,
    slug: host.slug,
    hostType: host.host_type,
    description: host.description,
    contactEmail: host.contact_email,
    contactPhone: host.contact_phone,
    website: host.website,
    locationText: host.location_text,
    logoUrl: host.logo_url,
  })
  revalidatePath('/hosts')
  return result
}

export async function updateHost(
  hostId: string,
  updates: {
    name?: string
    slug?: string
    host_type?: string
    description?: string
    contact_email?: string
    contact_phone?: string
    website?: string
    location_text?: string
    logo_url?: string
  },
) {
  await fetchMutation(api.hosts.update, {
    hostId: hostId as Id<'hosts'>,
    name: updates.name,
    slug: updates.slug,
    hostType: updates.host_type,
    description: updates.description,
    contactEmail: updates.contact_email,
    contactPhone: updates.contact_phone,
    website: updates.website,
    locationText: updates.location_text,
    logoUrl: updates.logo_url,
  })
  revalidatePath('/hosts')
}

export async function updateHostStatus(hostId: string, status: string, action: string) {
  await fetchMutation(api.hosts.updateStatus, {
    hostId: hostId as Id<'hosts'>,
    status,
  })
  revalidatePath('/hosts')
}

export async function deleteHost(hostId: string) {
  await fetchMutation(api.hosts.remove, { hostId: hostId as Id<'hosts'> })
  revalidatePath('/hosts')
}

export async function getHostById(hostId: string) {
  const host = await fetchQuery(api.hosts.getById, { hostId: hostId as Id<'hosts'> })
  if (!host) return { host: null, eventCount: 0 }
  const stats = await fetchQuery(api.hosts.getStats, { hostId: hostId as Id<'hosts'> })
  return { host: mapHost(host), eventCount: stats.eventCount }
}
