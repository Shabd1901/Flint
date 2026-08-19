import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Fetch all in_progress attempts with their exam details
  const { data: attempts, error } = await supabase
    .from('exam_attempts')
    .select('id, exam_id, candidate_id, started_at, exams(duration_minutes)')
    .eq('status', 'in_progress')

  if (error || !attempts) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch attempts' })
  }

  const now = Date.now()
  const autoSubmittedIds: string[] = []

  for (const attempt of attempts) {
    const durationMinutes = (attempt.exams as any)?.duration_minutes || 60
    const startedAtMs = new Date(attempt.started_at).getTime()
    const expiresAtMs = startedAtMs + durationMinutes * 60 * 1000

    if (now >= expiresAtMs) {
      // Fetch questions and answers for auto-grading
      const { data: questions } = await supabase
        .from('questions')
        .select('id, correct_options, marks')
        .eq('exam_id', attempt.exam_id)

      const { data: answers } = await supabase
        .from('exam_answers')
        .select('question_id, selected_options')
        .eq('attempt_id', attempt.id)

      let totalScore = 0
      const answerMap = new Map(answers?.map(a => [a.question_id, a]))

      for (const q of (questions || [])) {
        const answer = answerMap.get(q.id)
        if (!answer) continue

        const correct = typeof q.correct_options === 'string' ? JSON.parse(q.correct_options) : (q.correct_options || [])
        const selected = typeof answer.selected_options === 'string' ? JSON.parse(answer.selected_options) : (answer.selected_options || [])

        const isCorrect = correct.length === selected.length && correct.every((c: string) => selected.includes(c))
        if (isCorrect) {
          totalScore += Number(q.marks) || 1
        }
      }

      // Mark as auto_submitted
      await supabase
        .from('exam_attempts')
        .update({
          status: 'auto_submitted',
          submitted_at: new Date().toISOString(),
          score: totalScore
        })
        .eq('id', attempt.id)

      autoSubmittedIds.push(attempt.id)
    }
  }

  return NextResponse.json({
    success: true,
    processedCount: attempts.length,
    autoSubmittedCount: autoSubmittedIds.length,
    autoSubmittedIds
  })
}
