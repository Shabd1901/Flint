import { createClient } from '@/utils/supabase/server'
import { findSimilarPairs, Submission } from '@/utils/similarity'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const threshold = Number(req.nextUrl.searchParams.get('threshold') || '80')
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all attempts for this contest with profiles
  const { data: attempts } = await supabase
    .from('contest_attempts')
    .select('id, candidate_id, profiles(name, email)')
    .eq('contest_id', id)

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ pairs: [] })
  }

  const attemptIds = attempts.map(a => a.id)

  // Fetch all code submissions
  const { data: submissions } = await supabase
    .from('code_submissions')
    .select('*, problems(title)')
    .in('contest_attempts_id', attemptIds)
    .order('submitted_at', { ascending: false })

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ pairs: [] })
  }

  // Build attempt -> candidate lookup
  const attemptToCandidate = new Map<string, { id: string; name: string; email: string }>()
  for (const a of attempts) {
    const p = a.profiles as any
    attemptToCandidate.set(a.id, {
      id: a.candidate_id,
      name: p?.name || 'Unknown',
      email: p?.email || ''
    })
  }

  // Pick latest submission per candidate per problem
  const latest = new Map<string, typeof submissions[0]>()
  for (const sub of submissions) {
    const candidate = attemptToCandidate.get(sub.contest_attempts_id)
    if (!candidate) continue
    const key = `${candidate.id}__${sub.problem_id}`
    if (!latest.has(key)) {
      latest.set(key, sub)
    }
  }

  // Build submission list for similarity engine
  const subList: Submission[] = []
  for (const sub of latest.values()) {
    const candidate = attemptToCandidate.get(sub.contest_attempts_id)
    if (!candidate) continue
    subList.push({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      sourceCode: sub.source_code,
      language: sub.language,
      problemId: sub.problem_id,
      problemTitle: (sub.problems as any)?.title || 'Problem'
    })
  }

  const pairs = findSimilarPairs(subList, threshold)

  return NextResponse.json({ pairs })
}
