import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ExamTakeWorkspace } from './ExamTakeWorkspace'
import { logViolation, heartbeatSession, submitExamAction, saveAnswerAction } from './actions'

export default async function ExamTake({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempt } = await supabase.from('exam_attempts')
    .select('*, exams(duration_minutes)')
    .eq('exam_id', id)
    .eq('candidate_id', user.id)
    .single()

  if (!attempt || attempt.status !== 'in_progress') {
    redirect(`/candidate/orgs/${org_id}/exams`)
  }

  const durationMinutes = (attempt.exams as any)?.duration_minutes || 60

  // Fetch questions (select specific columns — excludes correct_options from client)
  const { data: questions } = await supabase.from('questions')
    .select('id, text, type, options, max_words, file_types')
    .eq('exam_id', id)
    .order('created_at', { ascending: true })

  // Fetch any existing answers
  const { data: answers } = await supabase.from('exam_answers').select('*').eq('attempt_id', attempt.id)
  const answersMap = new Map(answers?.map(a => [a.question_id, a]))

  // Bind params to the standalone server actions (avoids Next.js 15 closure serialization crash)
  const submitExam = submitExamAction.bind(null, id, org_id)
  const saveAnswer = saveAnswerAction

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
