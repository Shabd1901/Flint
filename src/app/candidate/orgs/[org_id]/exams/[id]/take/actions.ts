'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSB } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const VIOLATION_WEIGHTS: Record<string, number> = {
  tab_switch: 2,
  blur: 1,
  fullscreen_exit: 3,
  devtools: 3,
  multi_session: 5,
  copy_paste_blocked: 1,
}

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

function getAdminClient() {
  return createSB(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function logViolation(attemptId: string, type: string, meta?: any) {
  const supabase = await createClient()
  
  // Insert violation event
  await supabase.from('violation_events').insert({
    attempt_id: attemptId,
    type,
    meta: meta || {}
  })

  // Compute and update violation_score (weighted sum of all events for this attempt)
  const { data: events } = await supabase
    .from('violation_events')
    .select('type')
    .eq('attempt_id', attemptId)

  if (events) {
    const totalScore = events.reduce((sum, e) => {
      return sum + (VIOLATION_WEIGHTS[e.type] || 1)
    }, 0)

    const adminClient = getAdminClient()
    await adminClient
      .from('exam_attempts')
      .update({ violation_score: totalScore })
      .eq('id', attemptId)
  }
}

export async function heartbeatSession(attemptId: string, sessionToken: string): Promise<{ valid: boolean }> {
  const supabase = await createClient()

  const { data: attempt, error } = await supabase
    .from('exam_attempts')
    .select('active_session_token, last_heartbeat')
    .eq('id', attemptId)
    .single()

  if (error || !attempt) {
    return { valid: false }
  }

  const adminClient = getAdminClient()

  if (!attempt.active_session_token) {
    await adminClient
      .from('exam_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  if (attempt.active_session_token === sessionToken) {
    await adminClient
      .from('exam_attempts')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  const lastHeartbeat = attempt.last_heartbeat ? new Date(attempt.last_heartbeat).getTime() : 0
  const now = Date.now()

  if (now - lastHeartbeat > 15000) {
    await adminClient
      .from('exam_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  await logViolation(attemptId, 'multi_session', { action: 'concurrent_session_detected', new_token: sessionToken })
  return { valid: false }
}

// submitExam — takes examId and orgId as explicit params instead of closures
export async function submitExamAction(examId: string, orgId: string) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = getAdminClient()

  // Atomic idempotency guard: transition status from in_progress -> submitted
  const { data: updatedAttempt } = await adminClient.from('exam_attempts')
    .update({ 
      status: 'submitted', 
      submitted_at: new Date().toISOString()
    })
    .eq('exam_id', examId)
    .eq('candidate_id', user.id)
    .eq('status', 'in_progress')
    .select('id')
    .single()

  if (!updatedAttempt) {
    revalidatePath(`/candidate/orgs/${orgId}/exams`)
    redirect(`/candidate/orgs/${orgId}/exams`)
    return
  }

  // Auto-grade
  const { data: allQuestions } = await s.from('questions')
    .select('id, type, correct_options, correct_text, correct_number, tolerance, marks')
    .eq('exam_id', examId)

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

  await adminClient.from('exam_attempts')
    .update({ score: totalScore })
    .eq('id', updatedAttempt.id)

  revalidatePath(`/candidate/orgs/${orgId}/exams`)
  redirect(`/candidate/orgs/${orgId}/exams`)
}

// saveAnswer — standalone server action, no closures over params
export async function saveAnswerAction(formData: FormData) {
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
      const adminClient = getAdminClient()

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
