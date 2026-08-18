'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExam(formData: FormData) {
  try {
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    const { data: o } = await s.from('orgs').select('id').limit(1).single()

    if (!o) throw new Error("Organization not found.")

    const { error } = await s.from('exams').insert({
      org_id: o.id,
      title: formData.get('title'),
      description: formData.get('description'),
      duration_minutes: Number(formData.get('duration_minutes')),
      start_at: formData.get('start_at') || null,
      end_at: formData.get('end_at') || null,
      negative_marking: formData.get('negative_marking') === 'on',
      randomize: formData.get('randomize') === 'on',
      status: 'draft'
    })

    if (error) throw error

    revalidatePath('/admin/exams')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to create exam." }
  }
}

export async function deleteExam(examId: string) {
  try {
    const s = await createClient()
    const { error } = await s.from('exams').delete().eq('id', examId)
    if (error) throw error

    revalidatePath('/admin/exams')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to delete exam." }
  }
}

export async function duplicateExam(examId: string) {
  try {
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    const { data: o } = await s.from('orgs').select('id').limit(1).single()

    // Fetch original exam
    const { data: original, error: fetchErr } = await s.from('exams').select('*').eq('id', examId).single()
    if (fetchErr) throw fetchErr
    if (!original || !o) throw new Error("Original exam or organization not found.")

    // Clone exam as draft
    const { data: newExam, error: insertErr } = await s.from('exams').insert({
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

    if (insertErr) throw insertErr
    if (!newExam) throw new Error("Failed to create duplicated exam.")

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
      const { error: qErr } = await s.from('questions').insert(clonedQuestions)
      if (qErr) throw qErr
    }

    revalidatePath('/admin/exams')
    redirect(`/admin/exams/${newExam.id}`)
  } catch (err: any) {
    // If it's a redirect error (NEXT_REDIRECT), re-throw it so Next.js handles the redirect properly
    if (err.message && err.message.includes('NEXT_REDIRECT')) {
      throw err
    }
    return { error: err.message || "Failed to duplicate exam." }
  }
}
