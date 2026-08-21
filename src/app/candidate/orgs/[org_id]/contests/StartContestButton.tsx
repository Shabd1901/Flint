'use client'

import { useTransition } from 'react'
import { startContestAction } from './actions'
import { toast } from 'react-hot-toast'
import { Play } from 'lucide-react'

export function StartContestButton({ orgId, contestId, label = 'Start Contest' }: { orgId: string, contestId: string, label?: string }) {
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    startTransition(async () => {
      try {
        const result = await startContestAction(orgId, contestId)
        if (result?.error) {
          toast.error(result.error)
        }
      } catch (err: any) {
        if (err.message !== 'NEXT_REDIRECT') {
          toast.error('An unexpected error occurred')
        }
      }
    })
  }

  return (
    <button 
      onClick={handleStart}
      disabled={isPending} 
      className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Play size={16} />
      )}
      {label}
    </button>
  )
}
