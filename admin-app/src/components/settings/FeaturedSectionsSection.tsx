'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateFeaturedSection } from '@/lib/actions/settings'
import { Layout } from 'lucide-react'
import { SettingsCard } from './SettingsCard'
import type { FeaturedSection } from './types'

interface FeaturedSectionsSectionProps {
  sections: FeaturedSection[]
}

export function FeaturedSectionsSection({ sections }: FeaturedSectionsSectionProps) {
  const router = useRouter()
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionEditForm, setSectionEditForm] = useState({ label: '', description: '' })
  const [isUpdatingSection, setIsUpdatingSection] = useState(false)

  const handleToggleSection = async (section: FeaturedSection) => {
    setIsUpdatingSection(true)
    try {
      await updateFeaturedSection(section.id, { enabled: !section.enabled })
      toast.success(`${section.label} ${!section.enabled ? 'enabled' : 'disabled'}`)
      router.refresh()
    } catch (err) {
      toast.error('Failed to update section')
    } finally {
      setIsUpdatingSection(false)
    }
  }

  const startEditingSection = (section: FeaturedSection) => {
    setEditingSection(section.id)
    setSectionEditForm({ label: section.label, description: section.description || '' })
  }

  const handleSaveSection = async (sectionId: string) => {
    setIsUpdatingSection(true)
    try {
      await updateFeaturedSection(sectionId, {
        label: sectionEditForm.label,
        description: sectionEditForm.description,
      })
      toast.success('Section updated')
      setEditingSection(null)
      router.refresh()
    } catch (err) {
      toast.error('Failed to update section')
    } finally {
      setIsUpdatingSection(false)
    }
  }

  return (
    <SettingsCard icon={Layout} title="Platform Configuration" subtitle="Manage featured sections">
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No featured sections configured.
        </p>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => {
            const isEditing = editingSection === section.id
            return (
              <div key={section.id} className="border border-outline-variant rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={sectionEditForm.label}
                          onChange={(e) =>
                            setSectionEditForm({ ...sectionEditForm, label: e.target.value })
                          }
                          placeholder="Section label"
                        />
                        <Input
                          value={sectionEditForm.description}
                          onChange={(e) =>
                            setSectionEditForm({
                              ...sectionEditForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Section description"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground truncate">
                          {section.label}
                        </p>
                        {section.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {section.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSaveSection(section.id)}
                          disabled={isUpdatingSection}
                          className="bg-primary text-primary-foreground"
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => handleToggleSection(section)}
                          disabled={isUpdatingSection}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingSection(section)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SettingsCard>
  )
}
