import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Fetch contest
  const { data: contest } = await supabase.from('contests').select('title, org_id').eq('id', id).single()
  if (!contest) {
    return new NextResponse('Contest not found', { status: 404 })
  }

  // Fetch attempts with profile info
  const { data: attempts } = await supabase
    .from('contest_attempts')
    .select('*, profiles(name, email)')
    .eq('contest_id', id)

  if (!attempts) {
    return new NextResponse('No attempt data found', { status: 404 })
  }

  // Fetch all code submissions for these attempts
  const attemptIds = attempts.map(a => a.id)
  const { data: allSubmissions } = attemptIds.length > 0
    ? await supabase
        .from('code_submissions')
        .select('*, problems(title)')
        .in('contest_attempts_id', attemptIds)
    : { data: [] }

  // Collect all problems for column headers
  const problemTitles = new Map<string, string>()
  for (const sub of (allSubmissions || [])) {
    problemTitles.set(sub.problem_id, (sub.problems as any)?.title || 'Problem')
  }
  const problemIds = Array.from(problemTitles.keys())

  // Build per-candidate data
  const rows: string[] = []

  for (const attempt of attempts) {
    const profile = attempt.profiles as any
    const subs = (allSubmissions || []).filter(s => s.contest_attempts_id === attempt.id)

    // Best score per problem
    const bestScores = new Map<string, number>()
    const subCounts = new Map<string, number>()
    for (const sub of subs) {
      const current = bestScores.get(sub.problem_id) || 0
      bestScores.set(sub.problem_id, Math.max(current, Number(sub.score) || 0))
      subCounts.set(sub.problem_id, (subCounts.get(sub.problem_id) || 0) + 1)
    }

    let totalScore = 0
    for (const score of bestScores.values()) {
      totalScore += score
    }

    let totalSubmissions = 0
    for (const count of subCounts.values()) {
      totalSubmissions += count
    }

    const problemScoreCells = problemIds.map(pid => bestScores.get(pid) ?? 0)

    const row = [
      `"${(profile?.name || '').replace(/"/g, '""')}"`,
      `"${(profile?.email || '').replace(/"/g, '""')}"`,
      attempt.status,
      totalScore,
      totalSubmissions,
      ...problemScoreCells,
      attempt.started_at ? new Date(attempt.started_at).toISOString() : '',
      attempt.submitted_at ? new Date(attempt.submitted_at).toISOString() : ''
    ].join(',')

    rows.push(row)
  }

  // Sort rows by total score descending
  rows.sort((a, b) => {
    const scoreA = Number(a.split(',')[3]) || 0
    const scoreB = Number(b.split(',')[3]) || 0
    return scoreB - scoreA
  })

  // Generate CSV
  const headers = [
    'Candidate Name',
    'Candidate Email',
    'Status',
    'Total Score',
    'Total Submissions',
    ...problemIds.map(pid => `"${(problemTitles.get(pid) || 'Problem').replace(/"/g, '""')}"`),
    'Started At',
    'Submitted At'
  ]

  const csvContent = [headers.join(','), ...rows].join('\n')
  const filename = `${contest.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
