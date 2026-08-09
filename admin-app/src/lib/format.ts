import { format } from 'date-fns'

const SHORT_DATE = 'MMM d, yyyy'
const SHORT_DATETIME = 'MMM d, yyyy · HH:mm'

function toDate(value?: number | string | Date | null): Date | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value?: number | string | Date | null): string {
  const date = toDate(value)
  return date ? format(date, SHORT_DATE) : '—'
}

export function formatDateTime(value?: number | string | Date | null): string {
  const date = toDate(value)
  return date ? format(date, SHORT_DATETIME) : '—'
}

export function toDateTimeLocal(ts?: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
