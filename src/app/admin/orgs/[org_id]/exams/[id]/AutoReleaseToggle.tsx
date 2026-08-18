'use client'

import { useOptimistic, useTransition } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toggleResultRelease } from './actions'

export function AutoReleaseToggle({ examId, orgId, initialValue }: { examId: string, orgId: string, initialValue: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticValue, setOptimisticValue] = useOptimistic(
    initialValue,
    (state, newValue: boolean) => newValue
  )

  const handleToggle = () => {
    const newValue = !optimisticValue
    startTransition(async () => {
      setOptimisticValue(newValue)
      await toggleResultRelease(examId, orgId, !newValue)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
        optimisticValue
          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
          : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
      } ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {optimisticValue ? (
        <><Eye size={14} /> Auto-Release: ON</>
      ) : (
        <><EyeOff size={14} /> Scores Held</>
      )}
    </button>
  )
}
