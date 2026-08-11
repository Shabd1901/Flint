'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export function ExamTimer({
  startedAt,
  durationMinutes,
  onExpire,
}: {
  startedAt: string
  durationMinutes: number
  onExpire: () => void
}) {
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null)

  useEffect(() => {
    const startMs = new Date(startedAt).getTime()
    const endMs = startMs + durationMinutes * 60 * 1000

    const updateTimer = () => {
      const remaining = endMs - Date.now()
      if (remaining <= 0) {
        setTimeLeftMs(0)
        onExpire()
      } else {
        setTimeLeftMs(remaining)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startedAt, durationMinutes, onExpire])

  if (timeLeftMs === null) return null

  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const isUrgent = totalSeconds < 300 // less than 5 mins

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono font-semibold transition ${
        isUrgent
          ? 'border-rose-200 bg-rose-50 text-rose-700 animate-pulse'
          : 'border-line bg-surface-soft text-text'
      }`}
    >
      <Clock size={16} className={isUrgent ? 'text-rose-600' : 'text-text-muted'} />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
