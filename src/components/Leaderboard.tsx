'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy } from 'lucide-react'

export interface LeaderboardEntry {
  candidate_id: string
  name: string
  score: number
  passed_count: number
  total_count: number
}

export function Leaderboard({ contestId, initialEntries = [] }: { contestId: string, initialEntries?: LeaderboardEntry[] }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`contest:${contestId}:leaderboard`)

    channel
      .on('broadcast', { event: 'score_update' }, (payload) => {
        const update: LeaderboardEntry = payload.payload
        setEntries((prev) => {
          const map = new Map(prev.map(item => [item.candidate_id, item]))
          map.set(update.candidate_id, update)
          return Array.from(map.values()).sort((a, b) => b.score - a.score)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contestId])

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" /> Live Leaderboard
        </h3>
        <span className="live-dot" />
      </div>

      <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
        {entries.map((entry, idx) => (
          <div key={entry.candidate_id} className="flex items-center justify-between p-2 rounded bg-surface-soft">
            <span className="font-mono font-medium">
              #{idx + 1} {entry.name}
            </span>
            <span className="font-mono font-bold text-accent">
              {entry.score} pts ({entry.passed_count}/{entry.total_count})
            </span>
          </div>
        ))}

        {entries.length === 0 && (
          <p className="text-text-muted text-center py-4">No submissions yet.</p>
        )}
      </div>
    </div>
  )
}
