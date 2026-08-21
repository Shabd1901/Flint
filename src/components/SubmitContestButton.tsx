'use client'

import { useTransition } from 'react'
import { submitContestAction } from '@/app/candidate/orgs/[org_id]/contests/actions'
import { toast } from 'react-hot-toast'
import { Check } from 'lucide-react'

export function SubmitContestButton({ orgId, contestId }: { orgId: string, contestId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!confirm('Are you sure you want to submit your contest? You cannot modify your submissions after this.')) return

    startTransition(async () => {
      try {
        const result = await submitContestAction(orgId, contestId)
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
      onClick={handleSubmit}
      disabled={isPending} 
      className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Check size={16} />
      )}
      Submit Contest
    </button>
  )
}
