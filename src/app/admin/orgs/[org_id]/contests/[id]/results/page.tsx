import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Download, Trophy, Clock, Code2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TbdNotice } from '@/components/TbdNotice'

export default async function ContestResults({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: contest } = await supabase.from('contests').select('*').eq('id', id).single()

  // Fetch all attempts with candidate profiles
  const { data: attempts } = await adminClient
    .from('contest_attempts')
    .select('*, profiles(name, email)')
    .eq('contest_id', id)
    .order('started_at', { ascending: false })

  // Fetch all code submissions for this contest's attempts
  const attemptIds = attempts?.map(a => a.id) || []
  const { data: allSubmissions } = attemptIds.length > 0
    ? await supabase
        .from('code_submissions')
        .select('*, problems(title)')
        .in('contest_attempts_id', attemptIds)
        .order('submitted_at', { ascending: false })
    : { data: [] }

  // Build per-candidate leaderboard: aggregate best score per problem
  const candidateScores = new Map<string, {
    name: string
    email: string
    status: string
    started_at: string
    submitted_at: string | null
    totalScore: number
    problemScores: Map<string, { title: string; bestScore: number; submissions: number }>
  }>()

  for (const attempt of (attempts || [])) {
    const profile = attempt.profiles as any
    const subs = (allSubmissions || []).filter(s => s.contest_attempts_id === attempt.id)

    const problemScores = new Map<string, { title: string; bestScore: number; submissions: number }>()
    let totalScore = 0

    for (const sub of subs) {
      const pid = sub.problem_id
      const existing = problemScores.get(pid)
      const subScore = Number(sub.score) || 0
      const problemTitle = (sub.problems as any)?.title || 'Problem'

      if (existing) {
        existing.submissions++
        if (subScore > existing.bestScore) {
          existing.bestScore = subScore
        }
      } else {
        problemScores.set(pid, { title: problemTitle, bestScore: subScore, submissions: 1 })
      }
    }

    // Total = sum of best scores across all problems
    for (const ps of problemScores.values()) {
      totalScore += ps.bestScore
    }

    candidateScores.set(attempt.candidate_id, {
      name: profile?.name || 'Unknown',
      email: profile?.email || '',
      status: attempt.status,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      totalScore,
      problemScores
    })
  }

  // Sort by total score descending
  const leaderboard = Array.from(candidateScores.entries())
    .sort((a, b) => b[1].totalScore - a[1].totalScore)

  // Collect all unique problem IDs for column headers
  const allProblemIds = new Set<string>()
  const problemTitles = new Map<string, string>()
  for (const [, data] of leaderboard) {
    for (const [pid, ps] of data.problemScores) {
      allProblemIds.add(pid)
      problemTitles.set(pid, ps.title)
    }
  }
  const problemColumns = Array.from(allProblemIds)

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/orgs/${org_id}/contests`} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-text">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{contest?.title} - Leaderboard</h1>
            <p className="text-sm text-text-muted mt-1">Live results and code submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href={`/api/admin/contests/${id}/export`} className="btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-soft border-b border-line text-text-muted font-medium">
              <tr>
                <th className="px-5 py-3 whitespace-nowrap">Rank</th>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3 whitespace-nowrap">Status</th>
                <th className="px-5 py-3 whitespace-nowrap text-right">Total Score</th>
                {problemColumns.map(pid => (
                  <th key={pid} className="px-5 py-3 whitespace-nowrap text-right text-xs">
                    {problemTitles.get(pid)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4 + problemColumns.length} className="px-5 py-8 text-center text-text-muted">
                    No attempts recorded yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map(([candidateId, data], index) => (
                  <tr key={candidateId} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-text-muted">
                      #{index + 1}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-text">{data.name}</div>
                      <div className="text-xs text-text-muted">{data.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                        data.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                        data.status === 'auto_submitted' ? 'bg-slate-100 text-slate-700' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {data.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-accent">
                      {data.totalScore}
                    </td>
                    {problemColumns.map(pid => {
                      const pScore = data.problemScores.get(pid)
                      return (
                        <td key={pid} className="px-5 py-3 text-right">
                          {pScore ? (
                            <div>
                              <div className="font-semibold text-text">{pScore.bestScore}</div>
                              <div className="text-[10px] text-text-muted">{pScore.submissions} subs</div>
                            </div>
                          ) : (
                            <span className="text-text-muted/30">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
