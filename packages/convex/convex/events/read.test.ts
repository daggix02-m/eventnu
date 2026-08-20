import { describe, expect, it, vi } from 'vitest'
import { Doc } from '../_generated/dataModel'

vi.mock('../helpers', () => ({
  requireAdmin: vi.fn(async () => ({ _id: 'profiles_admin' })),
  requireUser: vi.fn(async () => ({ _id: 'profiles_user' })),
  getUserProfile: vi.fn(),
}))

const { list, getStorageUrls } = await import('./read')

type ListHandler = (
  ctx: unknown,
  args: unknown,
) => Promise<{
  page: Array<Partial<Doc<'events'>>>
  isDone: boolean
  continueCursor: string | null
}>
const listHandler = (list as unknown as { _handler: ListHandler })._handler

type FilterExpr = {
  type: string
  exprs?: FilterExpr[]
  l?: unknown
  r?: unknown
  e?: FilterExpr
  path?: string
}

const builder = {
  and: (...exprs: FilterExpr[]) => ({ type: 'and', exprs }),
  or: (...exprs: FilterExpr[]) => ({ type: 'or', exprs }),
  eq: (l: unknown, r: unknown) => ({ type: 'eq', l, r }),
  field: (path: string) => ({ type: 'field', path }),
}

function resolve(expr: FilterExpr, doc: Record<string, unknown>): boolean {
  switch (expr.type) {
    case 'field':
      return doc[expr.path as string] as boolean
    case 'eq':
      return resolve(expr.l as FilterExpr, doc) === expr.r
    case 'and':
      return (expr.exprs ?? []).every((e) => resolve(e, doc))
    case 'or':
      return (expr.exprs ?? []).some((e) => resolve(e, doc))
    default:
      return true
  }
}

function makeListDb(events: Array<Partial<Doc<'events'>>>) {
  let predicate: ((f: typeof builder) => FilterExpr) | null = null
  const usedIndexes: string[] = []
  let searchIndexName: string | null = null
  let searchPredicate: (() => unknown) | null = null
  const searchSpy = vi.fn((_field: string, q: string) => ({ field: _field, q }))
  const db = {
    query: () => ({
      withIndex: (name: string, _pred?: unknown) => {
        usedIndexes.push(name)
        return chain
      },
      withSearchIndex: (
        name: string,
        pred: (q: { search: (f: string, q: string) => { eq: () => unknown } }) => unknown,
      ) => {
        usedIndexes.push(name)
        searchIndexName = name
        // Proxy the builder's `search` call so the mock can see the query
        // string the handler passed, then delegate to the real predicate.
        const proxyBuilder = {
          search: searchSpy,
          eq: (field: unknown, value: unknown) => ({ type: 'eq', field, value }),
        }
        searchPredicate = () => pred(proxyBuilder as never)
        return searchChain
      },
      order: () => chain,
      filter: (pred: (f: typeof builder) => FilterExpr) => {
        predicate = pred
        return chain
      },
      paginate: () => ({
        page: events.filter((e) =>
          predicate ? resolve(predicate(builder), e as Record<string, unknown>) : true,
        ),
        isDone: true,
        continueCursor: null,
      }),
    }),
  }
  const chain = {
    withIndex: db.query().withIndex,
    order: db.query().order,
    filter: db.query().filter,
    paginate: db.query().paginate,
  }
  const searchChain = {
    take: async () => {
      if (!searchPredicate) return events
      // The real runtime evaluates the predicate when the query runs; invoke it
      // here so the spy captures the query string the handler passed.
      searchPredicate()
      const q = searchSpy.mock.calls.at(-1)?.[1] ?? ''
      return events.filter((e) =>
        (searchIndexName === 'search_description'
          ? String(e.description ?? '')
          : String(e.title ?? '')
        )
          .toLowerCase()
          .includes(q),
      )
    },
  }
  return { db, getUsedIndexes: () => usedIndexes }
}

const event = (overrides: Partial<Doc<'events'>>): Partial<Doc<'events'>> => ({
  _id: 'events_test' as Doc<'events'>['_id'],
  _creationTime: 1,
  title: 'Sauti Sol Live',
  description: 'A night of Afro-pop',
  status: 'published',
  source: 'admin',
  isFeatured: false,
  frequencyType: 'once',
  ...overrides,
})

describe('events list filters', () => {
  const events = [
    event({
      _id: 'events_a' as Doc<'events'>['_id'],
      source: 'admin',
      isFeatured: true,
      frequencyType: 'once',
    }),
    event({
      _id: 'events_b' as Doc<'events'>['_id'],
      source: 'instagram',
      isFeatured: false,
      frequencyType: 'weekly',
    }),
    event({
      _id: 'events_c' as Doc<'events'>['_id'],
      source: 'admin',
      isFeatured: false,
      frequencyType: 'once',
    }),
  ]

  it('uses the by_status index when a status filter is given', async () => {
    const { db, getUsedIndexes } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    await listHandler(ctx, {
      paginationOpts: { cursor: null, numItems: 10 },
      status: 'published',
    })
    expect(getUsedIndexes()).toContain('by_status')
  })

  it('does not use an index when status is absent or "all"', async () => {
    const { db, getUsedIndexes } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    await listHandler(ctx, { paginationOpts: { cursor: null, numItems: 10 }, status: 'all' })
    expect(getUsedIndexes()).toEqual([])
  })

  it('filters by source inside the query', async () => {
    const { db } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    const result = await listHandler(ctx, {
      paginationOpts: { cursor: null, numItems: 10 },
      source: 'admin',
    })
    expect(result.page.map((e) => e._id)).toEqual(['events_a', 'events_c'])
  })

  it('filters by featured inside the query', async () => {
    const { db } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    const result = await listHandler(ctx, {
      paginationOpts: { cursor: null, numItems: 10 },
      featured: true,
    })
    expect(result.page.map((e) => e._id)).toEqual(['events_a'])
  })

  it('filters by frequency inside the query', async () => {
    const { db } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    const result = await listHandler(ctx, {
      paginationOpts: { cursor: null, numItems: 10 },
      frequency: 'weekly',
    })
    expect(result.page.map((e) => e._id)).toEqual(['events_b'])
  })

  it('combines source and featured filters', async () => {
    const { db } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    const result = await listHandler(ctx, {
      paginationOpts: { cursor: null, numItems: 10 },
      source: 'admin',
      featured: false,
    })
    expect(result.page.map((e) => e._id)).toEqual(['events_c'])
  })

  it('routes text search through the search index as a single page', async () => {
    const search = async (term: string) => {
      const { db, getUsedIndexes } = makeListDb(events)
      const ctx = { db } as unknown as Parameters<ListHandler>[0]
      const result = await listHandler(ctx, {
        paginationOpts: { cursor: null, numItems: 10 },
        search: term,
      })
      return { result, indexes: getUsedIndexes() }
    }

    const { result, indexes } = await search('afro')
    expect(indexes).toContain('search_title')
    expect(indexes).toContain('search_description')
    // Search results are relevance-ranked and bounded; they are returned as
    // one page (isDone true) rather than paginated (the old code filtered the
    // current page AFTER pagination and silently missed older matches).
    expect(result.page.map((e) => e._id)).toEqual(['events_a', 'events_b', 'events_c'])
    expect(result.isDone).toBe(true)
    expect(result.continueCursor).toBeNull()

    const none = await search('nope')
    expect(none.result.page).toEqual([])
  })

  it('returns everything when no filters are given', async () => {
    const { db } = makeListDb(events)
    const ctx = { db } as unknown as Parameters<ListHandler>[0]
    const result = await listHandler(ctx, { paginationOpts: { cursor: null, numItems: 10 } })
    expect(result.page).toHaveLength(3)
  })
})

describe('getStorageUrls IDOR protection', () => {
  type GetStorageUrlsHandler = (ctx: unknown, args: unknown) => Promise<unknown[]>
  const getStorageUrlsHandler = (getStorageUrls as unknown as { _handler: GetStorageUrlsHandler })
    ._handler

  function makeCtx(
    event: Doc<'events'> | null,
    images: Array<{ storageId?: string }> = [],
    orgProfile: { _id: string } | null = null,
  ) {
    const db = {
      get: vi.fn(async () => event),
      query: (table: string) => {
        if (table === 'organizerProfiles') {
          return {
            withIndex: () => ({
              first: vi.fn(async () => orgProfile),
            }),
          }
        }
        return {
          withIndex: () => ({
            take: vi.fn(async () => images),
          }),
        }
      },
    }
    const storage = { getUrl: vi.fn(async () => 'https://signed-url') }
    return { db, storage }
  }

  it('allows access to published events', async () => {
    const { db, storage } = makeCtx(
      { _id: 'events_1', status: 'published', ownerId: 'other_user' } as Doc<'events'>,
      [{ storageId: 'storage_1' }],
    )
    const ctx = { db, storage } as unknown as Parameters<GetStorageUrlsHandler>[0]
    const result = await getStorageUrlsHandler(ctx, { eventId: 'events_1' })
    expect(result).toEqual(['https://signed-url'])
  })

  it('blocks access to draft events owned by another user', async () => {
    const { db, storage } = makeCtx(
      { _id: 'events_1', status: 'draft', ownerId: 'org_other' } as Doc<'events'>,
      [{ storageId: 'storage_1' }],
      null, // no matching organizer profile
    )
    const ctx = { db, storage } as unknown as Parameters<GetStorageUrlsHandler>[0]
    await expect(getStorageUrlsHandler(ctx, { eventId: 'events_1' })).rejects.toThrow(
      'Not authorized',
    )
  })

  it('allows access to own draft events via organizer profile lookup', async () => {
    const { db, storage } = makeCtx(
      { _id: 'events_1', status: 'draft', ownerId: 'org_123' } as Doc<'events'>,
      [{ storageId: 'storage_1' }],
      { _id: 'org_123' }, // matching organizer profile
    )
    const ctx = { db, storage } as unknown as Parameters<GetStorageUrlsHandler>[0]
    const result = await getStorageUrlsHandler(ctx, { eventId: 'events_1' })
    expect(result).toEqual(['https://signed-url'])
  })

  it('blocks access to non-existent events', async () => {
    const { db, storage } = makeCtx(null)
    const ctx = { db, storage } as unknown as Parameters<GetStorageUrlsHandler>[0]
    await expect(getStorageUrlsHandler(ctx, { eventId: 'events_1' })).rejects.toThrow(
      'Event not found',
    )
  })
})
