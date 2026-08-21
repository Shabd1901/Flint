'use client'
import { useState, useTransition } from 'react'
import { PlusCircle } from 'lucide-react'
import { createHackathonAction } from './actions'
import { toast } from 'react-hot-toast'

export function CreateHackathonForm({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition()
  
  return (
    <form action={(formData) => {
      startTransition(async () => {
        const result = await createHackathonAction(orgId, formData)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success('Hackathon created successfully!')
          const form = document.getElementById('create-hackathon-form') as HTMLFormElement
          if (form) form.reset()
        }
      })
    }} id="create-hackathon-form" className="surface-card p-5 space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2">Launch New Hackathon</h3>
      
      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-muted">Title</span>
        <input name="title" required className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" placeholder="e.g. Genesis 2026" />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-muted">Description</span>
        <textarea name="description" required rows={3} className="w-full p-2 text-sm rounded-md border outline-none focus:border-accent" placeholder="Theme and overarching problem statements..."></textarea>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-muted">Rules & Guidelines</span>
        <textarea name="rules" rows={3} className="w-full p-2 text-sm rounded-md border outline-none focus:border-accent" placeholder="Judging criteria, constraints..."></textarea>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-text-muted">Min Team Size</span>
          <input name="min_team_size" type="number" required defaultValue={1} min={1} className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" />
        </label>
        
        <label className="block space-y-1">
          <span className="text-xs font-medium text-text-muted">Max Team Size</span>
          <input name="max_team_size" type="number" required defaultValue={4} min={1} className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-muted">Submission Deadline</span>
        <input name="due_at" type="datetime-local" required className="w-full h-9 px-3 text-sm rounded-md border outline-none focus:border-accent" />
      </label>

      <div className="space-y-2 pt-2 border-t border-line">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Required Submission Links</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="require_github" defaultChecked className="rounded text-accent focus:ring-accent" />
          GitHub Repository
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="require_video" className="rounded text-accent focus:ring-accent" />
          Demo Video URL
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="require_app_link" className="rounded text-accent focus:ring-accent" />
          Live App/Deployment URL
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="require_drive_link" className="rounded text-accent focus:ring-accent" />
          Google Drive (Presentation/Docs)
        </label>
      </div>

      <button disabled={isPending} className="w-full h-10 mt-2 bg-accent hover:bg-accent-strong text-white font-medium rounded-md flex items-center justify-center gap-2 transition disabled:opacity-50">
        <PlusCircle size={18} />
        {isPending ? 'Creating...' : 'Create Hackathon'}
      </button>
    </form>
  )
}
