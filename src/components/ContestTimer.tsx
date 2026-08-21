'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitContestAction } from '@/app/candidate/orgs/[org_id]/contests/actions'
import { Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function ContestTimer({ orgId, contestId, startedAt, durationMinutes }: { orgId: string, contestId: string, startedAt: string, durationMinutes: number }) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const startMs = new Date(startedAt).getTime()
    const durationMs = durationMinutes * 60 * 1000
    const endMs = startMs + durationMs

    let isSubmitting = false

    const interval = setInterval(() => {
      const now = Date.now()
      const remainingMs = endMs - now

      if (remainingMs <= 0) {
        clearInterval(interval)
        setTimeLeft('00:00:00')
        if (!isSubmitting) {
          isSubmitting = true
          toast.error("Time's up! Auto-submitting contest...")
          submitContestAction(orgId, contestId).catch(() => {})
        }
        return
      }

      setIsUrgent(remainingMs < 5 * 60 * 1000) // under 5 mins

      const hours = Math.floor(remainingMs / (1000 * 60 * 60))
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, durationMinutes, orgId, contestId])

  return (
    <div className={`flex items-center gap-2 font-mono text-sm font-semibold px-3 py-1.5 rounded-md ${isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-surface-soft text-text'}`}>
      <Clock size={16} />
      <span>{timeLeft}</span>
    </div>
  )
}
