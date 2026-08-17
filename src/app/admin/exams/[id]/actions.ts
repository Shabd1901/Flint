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

  const { data: { user } } = await s.auth.getUser()
  if (!user) return

  const { data: exam } = await s.from('exams').select('status').eq('id', examId).single()
  const { data: oldQ } = await s.from('questions').select('*').eq('id', questionId).single()

  const newState = {
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
  }

  await s.from('questions').update(newState).eq('id', questionId)

  // Audit trail for edits on published exams
  if (exam?.status === 'published' && oldQ) {
    await s.from('question_edits').insert({
      question_id: questionId,
      admin_id: user.id,
      previous_state: oldQ,
      new_state: newState
    })
  }

  revalidatePath(`/admin/exams/${examId}`)
}

export async function deleteQuestion(questionId: string, examId: string) {
  const s = await createClient()
  await s.from('questions').delete().eq('id', questionId)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function gradeExamAnswer(formData: FormData) {
  const s = await createClient()
  
  const answerId = formData.get('answer_id') as string
  const attemptId = formData.get('attempt_id') as string
  const marks = Number(formData.get('marks')) || 0
  const examId = formData.get('exam_id') as string

  // 1. Fetch old marks awarded (if any) to calculate delta
  const { data: answer } = await s.from('exam_answers').select('marks_awarded').eq('id', answerId).single()
  const oldMarks = Number(answer?.marks_awarded || 0)

  // 2. Update the answer with new marks
  await s.from('exam_answers').update({ marks_awarded: marks }).eq('id', answerId)

  // 3. Fetch current attempt score and apply the delta
  const { data: attempt } = await s.from('exam_attempts').select('score').eq('id', attemptId).single()
  const currentTotal = Number(attempt?.score || 0)
  const newTotal = currentTotal - oldMarks + marks

  // 4. Update attempt
  await s.from('exam_attempts').update({ score: newTotal }).eq('id', attemptId)

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

export async function importQuestions(examId: string, questions: any[]) {
  const s = await createClient()

  const { data: { user } } = await s.auth.getUser()
  if (!user) return

  const toInsert = questions.map(q => ({
    exam_id: examId,
    text: q.text,
    type: q.type || 'single',
    options: q.options || null,
    correct_options: q.correct_options || null,
    correct_text: q.correct_text || null,
    correct_number: q.correct_number ? Number(q.correct_number) : null,
    tolerance: q.tolerance ? Number(q.tolerance) : null,
    max_words: q.max_words ? Number(q.max_words) : null,
    file_types: q.file_types || null,
    marks: Number(q.marks) || 1
  }))

  await s.from('questions').insert(toInsert)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function importQuestionsCSV(examId: string, csvText: string) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) return

  // Basic CSV parser handling quotes
  const lines: string[] = []
  let currentLine = ''
  let inQuotes = false
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    if (char === '"') inQuotes = !inQuotes
    else if (char === '\n' && !inQuotes) {
      lines.push(currentLine)
      currentLine = ''
      continue
    }
    currentLine += char
  }
  if (currentLine) lines.push(currentLine)

  const toInsert = []
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols: string[] = []
    let currentCol = ''
    inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) {
        cols.push(currentCol.trim())
        currentCol = ''
        continue
      } else {
        currentCol += char
      }
    }
    cols.push(currentCol.trim())

    const type = cols[0]?.toLowerCase() || 'single'
    const text = cols[1] || ''
    const optionsRaw = cols[2] || ''
    const correctRaw = cols[3] || ''
    const marks = Number(cols[4]) || 1

    const options = optionsRaw ? optionsRaw.split(';').map(o => o.trim()).filter(Boolean) : null
    const correct_options = correctRaw ? correctRaw.split(';').map(o => o.trim()).filter(Boolean) : null

    toInsert.push({
      exam_id: examId,
      type,
      text,
      options,
      correct_options,
      correct_text: type === 'short_answer' ? correctRaw : null,
      marks
    })
  }

  if (toInsert.length > 0) {
    await s.from('questions').insert(toInsert)
    revalidatePath(`/admin/exams/${examId}`)
  }
}

