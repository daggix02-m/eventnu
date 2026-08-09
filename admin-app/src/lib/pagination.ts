export const DEFAULT_PAGE_SIZE = 20

export function paginate<T>(items: T[], page = 1, perPage = DEFAULT_PAGE_SIZE): T[] {
  const start = (page - 1) * perPage
  return items.slice(start, start + perPage)
}
