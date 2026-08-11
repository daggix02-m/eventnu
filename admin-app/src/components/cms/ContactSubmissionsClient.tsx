'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markContactResolved, getContactSubmissions } from '@/lib/actions/cms'
import { contactSubmissionsKeys, useContactSubmissions } from '@/lib/api/cms'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'
import { formatDate } from '@/lib/format'

type ContactSubmission = Awaited<ReturnType<typeof getContactSubmissions>>[number]

export function ContactSubmissionsClient({ submissions }: { submissions: ContactSubmission[] }) {
  const queryClient = useQueryClient()
  const { data } = useContactSubmissions(submissions)
  const list = data ?? []
  const refreshSubmissions = () =>
    queryClient.invalidateQueries({ queryKey: contactSubmissionsKeys })

  const toggleResolved = async (id: string, resolved: boolean) => {
    try {
      await markContactResolved(id, resolved)
      toast.success('Submission updated')
      await refreshSubmissions()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update submission'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact Submissions</h1>
        <p className="text-muted-foreground">Messages submitted through the public contact form.</p>
      </div>

      <div className="bg-card rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-high border-b border-outline-variant">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Message</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No submissions yet.
                </td>
              </tr>
            )}
            {list.map((sub) => (
              <tr key={sub.id} className="border-b border-outline-variant last:border-0">
                <td className="px-4 py-3 font-medium">{sub.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{sub.email}</td>
                <td className="px-4 py-3 max-w-xs truncate">{sub.message}</td>
                <td className="px-4 py-3">
                  {sub.is_resolved ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Open</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(sub.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleResolved(sub.id, !sub.is_resolved)}
                    aria-label={
                      sub.is_resolved
                        ? `Mark message from ${sub.name} as open`
                        : `Mark message from ${sub.name} as resolved`
                    }
                  >
                    {sub.is_resolved ? <X size={16} /> : <Check size={16} />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
