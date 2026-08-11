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

  // Fetch exam
  const { data: exam } = await supabase.from('exams').select('title, org_id').eq('id', id).single()
  if (!exam) {
    return new NextResponse('Exam not found', { status: 404 })
  }

  // Fetch attempts with profile info and violation events
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, profiles(name, email), violation_events(type)')
    .eq('exam_id', id)
    .order('score', { ascending: false, nullsFirst: false })

  if (!attempts) {
    return new NextResponse('No attempt data found', { status: 404 })
  }

  // Generate CSV Header
  const headers = [
    'Candidate Name',
    'Candidate Email',
    'Status',
    'Score',
    'Violation Score',
    'Tab Switches',
    'Fullscreen Exits',
    'DevTools Detected',
    'Multi Session Detected',
    'Recommendation'
  ]

  const rows = attempts.map(attempt => {
    const profile = attempt.profiles as any
    const events = (attempt.violation_events || []) as any[]

    const tabSwitches = events.filter(e => e.type === 'tab_switch').length
    const fullscreenExits = events.filter(e => e.type === 'fullscreen_exit').length
    const devtools = events.filter(e => e.type === 'devtools').length
    const multiSession = events.filter(e => e.type === 'multi_session').length

    const violationScore = attempt.violation_score || 0
    const score = attempt.score ?? 'N/A'

    let recommendation = 'Shortlist Candidate'
    if (violationScore >= 5) {
      recommendation = 'FLAGGED FOR MANUAL REVIEW'
    } else if (violationScore > 2) {
      recommendation = 'Proceed with Caution'
    }

    return [
      `"${(profile?.name || '').replace(/"/g, '""')}"`,
      `"${(profile?.email || '').replace(/"/g, '""')}"`,
      attempt.status,
      score,
      violationScore,
      tabSwitches,
      fullscreenExits,
      devtools,
      multiSession,
      `"${recommendation}"`
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  const filename = `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_shortlist.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
