'use client'
import { useTransition } from 'react'
import { createTeamAction, joinTeamAction } from './actions'
import { toast } from 'react-hot-toast'
import { Users, UserPlus } from 'lucide-react'

export function JoinHackathonForms({ orgId, hackathonId, type }: { orgId: string, hackathonId: string, type: 'create' | 'join' }) {
  const [isPending, startTransition] = useTransition()

  if (type === 'create') {
    return (
      <form action={(formData) => {
        startTransition(async () => {
          const res = await createTeamAction(orgId, hackathonId, formData)
          if (res?.error) toast.error(res.error)
          else toast.success('Team created!')
        })
      }} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-text-muted">Team Name</span>
          <input name="name" required className="w-full h-10 px-3 text-sm rounded-md border outline-none focus:border-accent" placeholder="e.g. The Mavericks" />
        </label>
        <button disabled={isPending} className="w-full h-10 bg-text hover:bg-black text-white font-medium rounded-md flex items-center justify-center gap-2 transition disabled:opacity-50">
          <Users size={18} />
          {isPending ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    )
  }

  return (
    <form action={(formData) => {
      startTransition(async () => {
        const res = await joinTeamAction(orgId, hackathonId, formData)
        if (res?.error) toast.error(res.error)
        else toast.success('Joined team successfully!')
      })
    }} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-accent">Invite Code</span>
        <input name="invite_code" required className="w-full h-10 px-3 text-sm rounded-md border border-accent/30 outline-none focus:border-accent" placeholder="e.g. a1b2c3d4" />
      </label>
      <button disabled={isPending} className="w-full h-10 bg-accent hover:bg-accent-strong text-white font-medium rounded-md flex items-center justify-center gap-2 transition disabled:opacity-50">
        <UserPlus size={18} />
        {isPending ? 'Joining...' : 'Join Team'}
      </button>
    </form>
  )
}
