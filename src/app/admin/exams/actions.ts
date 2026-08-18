'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExam(formData: FormData) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  const { data: o } = await s.from('orgs').select('id').limit(1).single()

  await s.from('exams').insert({
    org_id: o!.id,
    title: formData.get('title'),
    description: formData.get('description'),
    duration_minutes: Number(formData.get('duration_minutes')),
    start_at: formData.get('start_at') || null,
    end_at: formData.get('end_at') || null,
    negative_marking: formData.get('negative_marking') === 'on',
    randomize: formData.get('randomize') === 'on',
    status: 'draft'
  })
  revalidatePath('/admin/exams')
}

export async function deleteExam(examId: string) {
  const s = await createClient()
  await s.from('exams').delete().eq('id', examId)
  revalidatePath('/admin/exams')
}

export async function duplicateExam(examId: string) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  const { data: o } = await s.from('orgs').select('id').limit(1).single()

  // Fetch original exam
  const { data: original } = await s.from('exams').select('*').eq('id', examId).single()
  if (!original || !o) return

  // Clone exam as draft
  const { data: newExam } = await s.from('exams').insert({
    org_id: o.id,
    title: `${original.title} (Copy)`,
    description: original.description,
    duration_minutes: original.duration_minutes,
    start_at: null,
    end_at: null,
    negative_marking: original.negative_marking,
    randomize: original.randomize,
    status: 'draft'
  }).select().single()

  if (!newExam) return

  // Clone all questions
  const { data: questions } = await s.from('questions').select('*').eq('exam_id', examId)
  if (questions && questions.length > 0) {
    const clonedQuestions = questions.map(q => ({
      exam_id: newExam.id,
      text: q.text,
      type: q.type,
      options: q.options,
      correct_options: q.correct_options,
      marks: q.marks
    }))
    await s.from('questions').insert(clonedQuestions)
  }

  revalidatePath('/admin/exams')
  redirect(`/admin/exams/${newExam.id}`)
}
