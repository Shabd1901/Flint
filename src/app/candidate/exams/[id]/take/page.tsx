import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProctoringWrapper } from './ProctoringWrapper'
import { QuestionForm } from './QuestionForm'
import { ExamTimer } from './ExamTimer'
import { logViolation, heartbeatSession } from './actions'

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

    const { data: currentAttempt } = await s.from('exam_attempts')
      .select('id')
      .eq('exam_id', id)
      .eq('candidate_id', user!.id)
      .single()

    if (!currentAttempt) return

    // Auto-grade
    const { data: allQuestions } = await s.from('questions')
      .select('id, correct_options, marks')
      .eq('exam_id', id)

    const { data: allAnswers } = await s.from('exam_answers')
      .select('question_id, selected_options')
      .eq('attempt_id', currentAttempt.id)

    let totalScore = 0
    const answerMap = new Map(allAnswers?.map(a => [a.question_id, a]))

    for (const q of (allQuestions || [])) {
      const answer = answerMap.get(q.id)
      if (!answer) continue

      const correct = typeof q.correct_options === 'string' ? JSON.parse(q.correct_options) : (q.correct_options || [])
      const selected = typeof answer.selected_options === 'string' ? JSON.parse(answer.selected_options) : (answer.selected_options || [])

      const isCorrect = correct.length === selected.length && correct.every((c: string) => selected.includes(c))
      if (isCorrect) {
        totalScore += Number(q.marks) || 1
      }
    }

    await s.from('exam_attempts')
      .update({ 
        status: 'submitted', 
        submitted_at: new Date().toISOString(),
        score: totalScore
      })
      .eq('id', currentAttempt.id)

    redirect('/candidate/exams')
  }

  async function saveAnswer(formData: FormData) {
    'use server'
    const s = await createClient()
    const questionId = formData.get('question_id') as string
    const attemptId = formData.get('attempt_id') as string
    
    const selectedRaw = formData.getAll('options')
    const selectedStr = formData.get('option')

    const selectedOptions = selectedRaw.length > 0 ? selectedRaw : (selectedStr ? [selectedStr] : [])

    const { data: existing } = await s.from('exam_answers').select('id').eq('attempt_id', attemptId).eq('question_id', questionId).single()
    
    if (existing) {
      await s.from('exam_answers').update({ selected_options: JSON.stringify(selectedOptions) }).eq('id', existing.id)
    } else {
      await s.from('exam_answers').insert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_options: JSON.stringify(selectedOptions)
      })
    }
  }

  return (
    <div className="container-page py-6 md:py-8 max-w-4xl space-y-6 relative">
      <ProctoringWrapper attemptId={attempt.id} logAction={logViolation} heartbeatAction={heartbeatSession} />

      <div className="flex flex-wrap justify-between items-center surface-card p-5 sticky top-4 z-10 shadow-lg gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Exam In Progress</h1>
          <p className="text-xs text-text-muted">Answers are auto-saved</p>
        </div>

        <div className="flex items-center gap-4">
          <ExamTimer startedAt={attempt.started_at} durationMinutes={durationMinutes} onExpire={submitExam} />
          
          <form action={submitExam}>
            <button className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition">
              Finish & Submit
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {questions?.map((q: any, i: number) => {
          const existingAns = answersMap.get(q.id)
          const savedSelection = existingAns ? (typeof existingAns.selected_options === 'string' ? JSON.parse(existingAns.selected_options) : existingAns.selected_options) : []

          return (
            <QuestionForm
              key={q.id}
              question={q}
              index={i}
              attemptId={attempt.id}
              savedSelection={savedSelection}
              saveAnswer={saveAnswer}
            />
          )
        })}
      </div>
    </div>
  )
}
