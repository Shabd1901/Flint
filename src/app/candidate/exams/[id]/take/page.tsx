import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ExamTakeWorkspace } from './ExamTakeWorkspace'
import { logViolation, heartbeatSession } from './actions'

function parseArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch {
      return [val]
    }
  }
  return []
}

export default async function ExamTake({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: attempt } = await supabase.from('exam_attempts')
    .select('*, exams(duration_minutes)')
    .eq('exam_id', id)
    .eq('candidate_id', user!.id)
    .single()

  if (!attempt || attempt.status !== 'in_progress') {
    redirect('/candidate/exams')
  }

  const durationMinutes = (attempt.exams as any)?.duration_minutes || 60

  // Fetch questions (select specific columns — excludes correct_options from client)
  const { data: questions } = await supabase.from('questions')
    .select('id, text, type, options')
    .eq('exam_id', id)
    .order('created_at', { ascending: true })

  // Fetch any existing answers
  const { data: answers } = await supabase.from('exam_answers').select('*').eq('attempt_id', attempt.id)
  const answersMap = new Map(answers?.map(a => [a.question_id, a]))

  async function submitExam() {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()

    // Atomic idempotency guard: transition status from in_progress -> submitted
    const { data: updatedAttempt } = await s.from('exam_attempts')
      .update({ 
        status: 'submitted', 
        submitted_at: new Date().toISOString()
      })
      .eq('exam_id', id)
      .eq('candidate_id', user!.id)
      .eq('status', 'in_progress')
      .select('id')
      .single()

    if (!updatedAttempt) {
      redirect('/candidate/exams')
      return
    }

    // Auto-grade
    const { data: allQuestions } = await s.from('questions')
      .select('id, correct_options, marks')
      .eq('exam_id', id)

    const { data: allAnswers } = await s.from('exam_answers')
      .select('question_id, selected_options')
      .eq('attempt_id', updatedAttempt.id)

    let totalScore = 0
    const answerMap = new Map(allAnswers?.map(a => [a.question_id, a]))

    for (const q of (allQuestions || [])) {
      const answer = answerMap.get(q.id)
      if (!answer) continue

      const correct = parseArray(q.correct_options)
      const selected = parseArray(answer.selected_options)

      const isCorrect = correct.length === selected.length && correct.every((c: string) => selected.includes(c))
      if (isCorrect) {
        totalScore += Number(q.marks) || 1
      }
    }

    await s.from('exam_attempts')
      .update({ score: totalScore })
      .eq('id', updatedAttempt.id)

    redirect('/candidate/exams')
  }

  async function saveAnswer(formData: FormData) {
    'use server'
    const s = await createClient()
    const questionId = formData.get('question_id') as string
    const attemptId = formData.get('attempt_id') as string
    
    const selectedRaw = formData.getAll('options').map(String)
    const selectedStr = formData.get('option') as string

    const selectedOptions = selectedRaw.length > 0 ? selectedRaw : (selectedStr ? [selectedStr] : [])

    const { data: existing } = await s.from('exam_answers').select('id').eq('attempt_id', attemptId).eq('question_id', questionId).single()
    
    if (existing) {
      await s.from('exam_answers').update({ selected_options: selectedOptions }).eq('id', existing.id)
    } else {
      await s.from('exam_answers').insert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_options: selectedOptions
      })
    }
  }

  return (
    <ExamTakeWorkspace
      attempt={attempt}
      durationMinutes={durationMinutes}
      questions={questions || []}
      answersMap={answersMap}
      submitExam={submitExam}
      saveAnswer={saveAnswer}
      logViolation={logViolation}
      heartbeatSession={heartbeatSession}
    />
  )
}
