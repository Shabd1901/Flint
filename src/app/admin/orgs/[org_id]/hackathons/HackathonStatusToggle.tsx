'use client'
import { useState, useTransition } from 'react'
import { toast } from 'react-hot-toast'
import { toggleHackathonStatus } from './actions'

export function HackathonStatusToggle({ orgId, hackathonId, initialStatus }: { orgId: string, hackathonId: string, initialStatus: string }) {
  const [isPending, startTransition] = useTransition()
  
  return (
    <button 
      onClick={() => {
        startTransition(async () => {
          const res = await toggleHackathonStatus(orgId, hackathonId, initialStatus)
          if (res?.error) toast.error(res.error)
          else toast.success(`Hackathon status updated!`)
        })
      }}
      disabled={isPending}
      className={`px-3 py-1 text-xs font-semibold rounded-full border transition ${
        initialStatus === 'live' 
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
          : initialStatus === 'closed'
          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          : 'bg-surface-soft text-text-muted border-line hover:text-text'
      }`}
    >
      {isPending ? 'Updating...' : initialStatus === 'live' ? 'Live' : initialStatus === 'closed' ? 'Closed' : 'Draft'}
    </button>
  )
}
