'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateExamStatus } from './actions'
import { Check } from 'lucide-react'

export function StatusUpdateForm({ examId, currentStatus }: { examId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updateExamStatus(examId, formData.get('status') as string)
      setShowSuccess(true)
    })
  }

  return (
    <form action={handleSubmit} className="flex gap-2 surface-card p-1.5 items-center">
      <select 
        name="status" 
        defaultValue={currentStatus} 
        className="h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50"
        disabled={isPending}
      >
        <option value="draft">Draft</option>
        <option value="live">Live</option>
        <option value="closed">Closed</option>
      </select>
      <button 
        type="submit" 
        disabled={isPending}
        className="relative overflow-hidden rounded-md border bg-white px-4 py-1.5 text-sm font-medium hover:bg-surface-soft transition disabled:opacity-50 w-[84px] h-9 flex items-center justify-center"
      >
        {isPending ? (
          <span className="animate-pulse">Updating</span>
        ) : showSuccess ? (
          <span className="flex items-center gap-1 text-emerald-600 animate-in slide-in-from-bottom-2 duration-300">
            <Check size={14} /> Done
          </span>
        ) : (
          <span>Update</span>
        )}
      </button>
    </form>
  )
}
