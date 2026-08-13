'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addQuestion(examId: string, formData: FormData) {
  const s = await createClient()

  const type = formData.get('type') as string

  // Parse MCQ options
  const optionsRaw = formData.get('options') as string
  const options = optionsRaw ? optionsRaw.split(',').map(o => o.trim()).filter(Boolean) : []

  const correctRaw = formData.get('correct_options') as string
  const correct_options = correctRaw ? correctRaw.split(',').map(o => o.trim()).filter(Boolean) : []

  // Parse new formats
  const fileTypesRaw = formData.get('file_types') as string
  const file_types = fileTypesRaw ? fileTypesRaw.split(',').map(o => o.trim()).filter(Boolean) : []

  await s.from('questions').insert({
    exam_id: examId,
    text: formData.get('question_text'),
    type,
    options: options.length > 0 ? options : null,
    correct_options: correct_options.length > 0 ? correct_options : null,
    correct_text: formData.get('correct_text') || null,
    correct_number: formData.get('correct_number') ? Number(formData.get('correct_number')) : null,
    tolerance: formData.get('tolerance') ? Number(formData.get('tolerance')) : null,
    max_words: formData.get('max_words') ? Number(formData.get('max_words')) : null,
    file_types: file_types.length > 0 ? file_types : null,
    marks: Number(formData.get('marks')) || 1
  })

  revalidatePath(`/admin/exams/${examId}`)
}

export async function updateQuestion(questionId: string, examId: string, formData: FormData) {
  const s = await createClient()

  const type = formData.get('type') as string

  const optionsRaw = formData.get('options') as string
  const options = optionsRaw ? optionsRaw.split(',').map(o => o.trim()).filter(Boolean) : []

  const correctRaw = formData.get('correct_options') as string
  const correct_options = correctRaw ? correctRaw.split(',').map(o => o.trim()).filter(Boolean) : []

  const fileTypesRaw = formData.get('file_types') as string
  const file_types = fileTypesRaw ? fileTypesRaw.split(',').map(o => o.trim()).filter(Boolean) : []

  await s.from('questions').update({
    text: formData.get('question_text'),
    type,
    options: options.length > 0 ? options : null,
    correct_options: correct_options.length > 0 ? correct_options : null,
    correct_text: formData.get('correct_text') || null,
    correct_number: formData.get('correct_number') ? Number(formData.get('correct_number')) : null,
    tolerance: formData.get('tolerance') ? Number(formData.get('tolerance')) : null,
    max_words: formData.get('max_words') ? Number(formData.get('max_words')) : null,
    file_types: file_types.length > 0 ? file_types : null,
    marks: Number(formData.get('marks')) || 1
  }).eq('id', questionId)

  revalidatePath(`/admin/exams/${examId}`)
}

export async function deleteQuestion(questionId: string, examId: string) {
  const s = await createClient()
  await s.from('questions').delete().eq('id', questionId)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function updateExamSettings(examId: string, formData: FormData) {
  const s = await createClient()
  await s.from('exams').update({
    title: formData.get('title'),
    description: formData.get('description'),
    duration_minutes: Number(formData.get('duration_minutes')),
    start_at: formData.get('start_at') || null,
    end_at: formData.get('end_at') || null,
    negative_marking: formData.get('negative_marking') === 'on',
    randomize: formData.get('randomize') === 'on',
  }).eq('id', examId)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function updateExamStatus(examId: string, status: string) {
  const s = await createClient()
  await s.from('exams').update({ status }).eq('id', examId)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function toggleResultRelease(examId: string, currentValue: boolean) {
  const s = await createClient()
  await s.from('exams').update({ auto_release_results: !currentValue }).eq('id', examId)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function deleteExamFromDetail(examId: string) {
  const s = await createClient()
  await s.from('exams').delete().eq('id', examId)
  revalidatePath('/admin/exams')
  redirect('/admin/exams')
}
