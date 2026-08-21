'use client'

import { useRef, useTransition } from 'react'
import { createContestAction } from './actions'
import { toast } from 'react-hot-toast'

export function CreateContestForm({ orgId }: { orgId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createContestAction(orgId, formData)
        if (result?.error) {
          toast.error(result.error)
        } else if (result?.success) {
          formRef.current?.reset()
          toast.success('Contest created!')
        }
      } catch (e: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="surface-card p-5 space-y-4 sticky top-8">
      <h2 className="text-lg font-semibold mb-4">Create New Contest</h2>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
        <input name="title" required disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" placeholder="e.g. Weekly Algorithm Challenge" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Duration (Minutes)</label>
        <input type="number" name="duration_minutes" required min="1" defaultValue="90" disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Start Time (Optional)</label>
        <input type="datetime-local" name="start_at" disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">End Time (Optional)</label>
        <input type="datetime-local" name="end_at" disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" />
      </div>

      <button disabled={isPending} className="w-full flex justify-center items-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
        {isPending ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Create Contest'
        )}
      </button>
    </form>
  )
}
