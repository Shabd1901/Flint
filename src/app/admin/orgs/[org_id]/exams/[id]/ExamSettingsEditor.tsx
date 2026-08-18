'use client'

import { useState, useTransition } from 'react'
import { Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { updateExamSettings } from './actions'

interface Exam {
  id: string
  title: string
  description: string
  duration_minutes: number
  start_at: string | null
  end_at: string | null
  negative_marking: boolean
  randomize: boolean
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function ExamSettingsEditor({ exam, orgId }: { exam: Exam, orgId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateExamSettings(exam.id, orgId, formData)
      setIsOpen(false)
    })
  }

  return (
    <div className="surface-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-soft/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-text-muted" />
          <span className="text-sm font-semibold">Exam Settings</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {isOpen && (
        <form action={handleSubmit} className="p-5 pt-2 space-y-4 border-t">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
            <input name="title" required defaultValue={exam.title} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
            <textarea name="description" rows={2} defaultValue={exam.description || ''} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Duration (mins)</label>
            <input type="number" name="duration_minutes" required defaultValue={exam.duration_minutes} min="1" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Start Time</label>
              <input type="datetime-local" name="start_at" defaultValue={toLocalDatetime(exam.start_at)} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">End Time</label>
              <input type="datetime-local" name="end_at" defaultValue={toLocalDatetime(exam.end_at)} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" />
            </div>
          </div>

          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="negative_marking" defaultChecked={exam.negative_marking} className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
              <span className="text-text-muted font-medium">Negative Marking</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="randomize" defaultChecked={exam.randomize} className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
              <span className="text-text-muted font-medium">Randomize Questions</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-soft transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
