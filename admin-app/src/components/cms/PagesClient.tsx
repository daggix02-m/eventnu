'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deletePage, getPages } from '@/lib/actions/cms'
import { pagesKeys, usePages } from '@/lib/api/cms'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'

type Page = Awaited<ReturnType<typeof getPages>>[number]

export function PagesClient({ pages }: { pages: Page[] }) {
  const queryClient = useQueryClient()
  const { data } = usePages(pages)
  const pageList = data ?? []
  const refreshPages = () => queryClient.invalidateQueries({ queryKey: pagesKeys })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleteTarget(null)
    setDeleting(id)
    try {
      await deletePage(id)
      toast.success('Page deleted')
      await refreshPages()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete page'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pages</h1>
          <p className="text-muted-foreground">Manage informational pages for the public site.</p>
        </div>
        <Button asChild>
          <Link href="/cms/pages/new">
            <Plus size={18} className="mr-2" />
            New Page
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-high border-b border-outline-variant">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Title</th>
              <th className="text-left px-4 py-3 font-semibold">Slug</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Order</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No pages yet. Create your first page.
                </td>
              </tr>
            )}
            {pageList.map((page) => (
              <tr
                key={page.id}
                className="border-b border-outline-variant last:border-0 hover:bg-surface-container-high/50"
              >
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 text-muted-foreground">/{page.slug}</td>
                <td className="px-4 py-3">
                  {page.is_published ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <Eye size={12} className="mr-1" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <EyeOff size={12} className="mr-1" /> Draft
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{page.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild aria-label={`Edit ${page.title}`}>
                      <Link href={`/cms/pages/${page.id}`}>
                        <Pencil size={16} />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(page.id)}
                      disabled={deleting === page.id}
                      aria-label={`Delete ${page.title}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete page?"
        description="Are you sure you want to delete this page?"
        confirmLabel="Delete"
        destructive
        loading={deleting === deleteTarget}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  )
}
