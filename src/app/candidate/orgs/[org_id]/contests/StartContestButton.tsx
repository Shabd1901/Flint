'use client'

import { useTransition } from 'react'
import { startContestAction } from './actions'
import { toast } from 'react-hot-toast'
import { Play } from 'lucide-react'

import { useRouter } from 'next/navigation'

export function StartContestButton({ orgId, contestId, label = 'Start Contest', disabled = false }: { orgId: string, contestId: string, label?: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleStart() {
    startTransition(async () => {
      try {
        const result = await startContestAction(orgId, contestId)
        if (result?.error) {
          toast.error(result.error)
        } else if (result?.url) {
          router.push(result.url)
        }
      } catch (err: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <button 
      onClick={handleStart}
      disabled={isPending || disabled} 
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
