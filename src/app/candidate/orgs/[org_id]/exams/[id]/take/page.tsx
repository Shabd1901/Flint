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
      redirect(`/candidate/orgs/${org_id}/exams`)
      return
    }

    // Auto-grade
    const { data: allQuestions } = await s.from('questions')
      .select('id, type, correct_options, correct_text, correct_number, tolerance, marks')
      .eq('exam_id', id)

    const { data: allAnswers } = await s.from('exam_answers')
      .select('question_id, selected_options, text_answer, number_answer')
      .eq('attempt_id', updatedAttempt.id)

    let totalScore = 0
    const answerMap = new Map(allAnswers?.map(a => [a.question_id, a]))

    for (const q of (allQuestions || [])) {
      const answer = answerMap.get(q.id)
      if (!answer) continue

      let isCorrect = false

      if (q.type === 'single' || q.type === 'multi') {
        const correct = parseArray(q.correct_options)
        const selected = parseArray(answer.selected_options)
        isCorrect = correct.length > 0 && correct.length === selected.length && correct.every((c: string) => selected.includes(c))
      } else if (q.type === 'true_false') {
        const correct = parseArray(q.correct_options)[0]
        const selected = parseArray(answer.selected_options)[0]
        isCorrect = !!correct && !!selected && correct === selected
      } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
        isCorrect = !!(q.correct_text && answer.text_answer && (q.correct_text.trim().toLowerCase() === answer.text_answer.trim().toLowerCase()))
      } else if (q.type === 'numerical') {
        if (q.correct_number !== null && answer.number_answer !== null) {
          const diff = Math.abs(q.correct_number - answer.number_answer)
          isCorrect = diff <= (q.tolerance || 0)
        }
      }

      if (isCorrect) {
        totalScore += Number(q.marks) || 1
      }
    }

    await s.from('exam_attempts')
      .update({ score: totalScore })
      .eq('id', updatedAttempt.id)

    redirect(`/candidate/orgs/${org_id}/exams`)
  }

  async function saveAnswer(formData: FormData) {
    'use server'
    const s = await createClient()
    const questionId = formData.get('question_id') as string
    const attemptId = formData.get('attempt_id') as string
    const qType = formData.get('q_type') as string
    
    let selectedOptions: string[] | null = null
    let textAnswer: string | null = null
    let numberAnswer: number | null = null
    let fileUrl: string | null = null

    // Block if attempt is not in_progress
    const { data: attemptCheck } = await s.from('exam_attempts').select('status').eq('id', attemptId).single()
    if (attemptCheck?.status !== 'in_progress') {
      throw new Error('Attempt is no longer in progress')
    }

    if (qType === 'single' || qType === 'multi' || qType === 'true_false') {
      const selectedRaw = formData.getAll('options').map(String)
      const selectedStr = formData.get('option') as string
      selectedOptions = selectedRaw.length > 0 ? selectedRaw : (selectedStr ? [selectedStr] : [])
    } else if (qType === 'short_answer' || qType === 'long_answer' || qType === 'fill_blank') {
      textAnswer = formData.get('text_answer') as string || null
    } else if (qType === 'numerical') {
      numberAnswer = formData.get('number_answer') ? Number(formData.get('number_answer')) : null
    } else if (qType === 'file_upload') {
      const file = formData.get('file_answer') as File | null
      if (file && file.size > 0) {
        const { createClient: createSB } = await import('@supabase/supabase-js')
        const adminClient = createSB(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const bucketName = 'exam-uploads'
        const { data: buckets } = await adminClient.storage.listBuckets()
        const bucketExists = buckets?.some((b: any) => b.name === bucketName)
        if (!bucketExists) {
          await adminClient.storage.createBucket(bucketName, { public: true })
        }

        const fileExt = file.name.split('.').pop()
        const filePath = `${attemptId}/${questionId}_${Date.now()}.${fileExt}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          })
        
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = adminClient.storage.from(bucketName).getPublicUrl(filePath)
          fileUrl = publicUrlData.publicUrl
        }
      }
    }

    const { data: existing } = await s.from('exam_answers').select('id, file_url').eq('attempt_id', attemptId).eq('question_id', questionId).single()
    
    if (existing && !fileUrl && qType === 'file_upload') {
      fileUrl = existing.file_url // Preserve existing file if no new one
    }
    
    if (existing) {
      await s.from('exam_answers').update({ 
        selected_options: selectedOptions,
        text_answer: textAnswer,
        number_answer: numberAnswer,
        file_url: fileUrl
      }).eq('id', existing.id)
    } else {
      await s.from('exam_answers').insert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_options: selectedOptions,
        text_answer: textAnswer,
        number_answer: numberAnswer,
        file_url: fileUrl
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
