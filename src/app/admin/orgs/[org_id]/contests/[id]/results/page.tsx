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
    <TbdNotice
      title="Contest Results & Leaderboard"
      description="The Contest Leaderboard and Results panel is tagged as TBD for Version 2 release. All leaderboard calculation logic, exports, and scoring algorithms are intact."
      backHref={`/admin/orgs/${org_id}`}
      backLabel="Back to Classroom"
    />
  )
}
