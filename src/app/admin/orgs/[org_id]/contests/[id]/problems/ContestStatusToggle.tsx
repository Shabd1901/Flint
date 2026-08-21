'use client'

import { useTransition } from 'react'
import { updateContestStatusAction } from './actions'
import { toast } from 'react-hot-toast'

export function ContestStatusToggle({ orgId, contestId, initialStatus }: { orgId: string, contestId: string, initialStatus: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData()
    formData.append('status', e.target.value)
    
    startTransition(async () => {
      try {
        const result = await updateContestStatusAction(orgId, contestId, formData)
        if (result?.error) {
          toast.error(result.error)
        } else if (result?.success) {
          toast.success('Contest status updated!')
        }
      } catch (err: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-text-muted">Status:</label>
      <select 
        defaultValue={initialStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className="h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm font-medium disabled:opacity-50"
      >
        <option value="draft">Draft</option>
        <option value="live">Live</option>
        <option value="closed">Closed</option>
      </select>
      {isPending && <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />}
    </div>
  )
}
