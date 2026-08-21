'use client'

import { useTransition } from 'react'
import { createExam } from './actions'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function CreateExamForm({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Convert local datetime to UTC ISO string to prevent timezone bugs
    const startAt = formData.get('start_at') as string
    const endAt = formData.get('end_at') as string
    if (startAt) formData.set('start_at', new Date(startAt).toISOString())
    if (endAt) formData.set('end_at', new Date(endAt).toISOString())

    startTransition(async () => {
      const res = await createExam(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Exam created successfully!")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-5 space-y-4 sticky top-8">
      <input type="hidden" name="org_id" value={orgId} />
      <h2 className="text-lg font-semibold mb-4">Create New Exam</h2>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
        <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Midterm Assessment" />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
        <textarea name="description" rows={3} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" placeholder="..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Duration (mins)</label>
        <input type="number" name="duration_minutes" required defaultValue="60" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Start Time (Opt)</label>
        <input type="datetime-local" name="start_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">End Time (Opt)</label>
        <input type="datetime-local" name="end_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
      </div>

      <div className="flex gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="negative_marking" className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
          <span className="text-text-muted font-medium">Negative Marking</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="randomize" className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
          <span className="text-text-muted font-medium">Randomize</span>
        </label>
      </div>

      <button disabled={isPending} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4 disabled:opacity-50">
        {isPending ? 'Creating...' : 'Create Draft'}
      </button>
    </form>
  )
}
