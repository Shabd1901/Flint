import { createClient } from '@/utils/supabase/server'
import { Download, Trophy, Clock, Code2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ContestResults({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()

  const { data: contest } = await supabase.from('contests').select('*').eq('id', id).single()

  // Fetch all attempts with candidate profiles
  const { data: attempts } = await supabase
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
      <Link href={`/admin/orgs/${org_id}/contests`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Contests
      </Link>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contest?.title}</h1>
          <p className="text-text-muted mt-1">Contest Results & Leaderboard</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/admin/contests/${id}/export`}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition"
          >
            <Download size={16} />
            Export Results CSV
          </a>
          <a
            href={`/admin/orgs/${org_id}/contests/${id}/problems`}
            className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-soft transition"
          >
            <Code2 size={16} />
            Manage Problems
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="w-12 h-12" />
          </div>
          <p className="text-sm font-medium text-text-muted">Total Participants</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight">{leaderboard.length}</p>
        </article>

        <article className="surface-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Code2 className="w-12 h-12" />
          </div>
          <p className="text-sm font-medium text-text-muted">Total Submissions</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight">{allSubmissions?.length || 0}</p>
        </article>

        <article className="surface-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-12 h-12" />
          </div>
          <p className="text-sm font-medium text-text-muted">Duration</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight">{contest?.duration_minutes}<span className="text-lg text-text-muted">m</span></p>
        </article>
      </section>

      {/* Leaderboard Table */}
      <section className="surface-card overflow-hidden">
        <div className="p-5 border-b bg-surface-soft/30 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Ranked Leaderboard
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Best score per problem, summed for total. Human-in-the-loop — review before shortlisting.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b bg-surface-soft/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="py-3 px-5 font-medium w-12">#</th>
                <th className="py-3 px-5 font-medium">Candidate</th>
                <th className="py-3 px-5 font-medium">Status</th>
                {problemColumns.map(pid => (
                  <th key={pid} className="py-3 px-5 font-medium text-center">
                    {problemTitles.get(pid) || 'Problem'}
                  </th>
                ))}
                <th className="py-3 px-5 font-medium text-center">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leaderboard.map(([candidateId, data], rank) => (
                <tr key={candidateId} className="hover:bg-surface-soft/70 transition-colors">
                  <td className="py-3 px-5 font-mono font-bold text-text-muted">{rank + 1}</td>
                  <td className="py-3 px-5">
                    <span className="font-medium">{data.name}</span>
                    <div className="text-xs text-text-muted mt-0.5">{data.email}</div>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      data.status === 'submitted' ? 'bg-emerald-100 text-emerald-800' :
                      data.status === 'auto_submitted' ? 'bg-amber-100 text-amber-800' :
                      data.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-surface-soft text-text-muted'
                    }`}>
                      {data.status}
                    </span>
                  </td>
                  {problemColumns.map(pid => {
                    const ps = data.problemScores.get(pid)
                    return (
                      <td key={pid} className="py-3 px-5 text-center">
                        {ps ? (
                          <div>
                            <span className="font-mono font-semibold">{ps.bestScore}</span>
                            <span className="text-xs text-text-muted ml-1">({ps.submissions} sub{ps.submissions !== 1 ? 's' : ''})</span>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="py-3 px-5 text-center">
                    <span className={`font-mono text-lg font-bold ${rank === 0 ? 'text-amber-600' : rank === 1 ? 'text-slate-500' : rank === 2 ? 'text-amber-800' : 'text-text'}`}>
                      {data.totalScore}
                    </span>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={3 + problemColumns.length + 1} className="py-12 text-center text-text-muted">
                    <Trophy className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No participants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
