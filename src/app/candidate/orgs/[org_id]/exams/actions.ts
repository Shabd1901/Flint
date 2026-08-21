'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function startExamAction(formData: FormData) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  
  const examId = formData.get('exam_id') as string
  const orgId = formData.get('org_id') as string

  // Validate start_at & end_at window
  const { data: ex } = await s.from('exams').select('start_at, end_at, status').eq('id', examId).single()
  if (!ex || ex.status !== 'live') return

  const now = new Date()
  if (ex.start_at && now < new Date(ex.start_at)) return
  if (ex.end_at && now > new Date(ex.end_at)) return

  // Create attempt
  const { data: attempt, error } = await s.from('exam_attempts').insert({
    exam_id: examId,
    candidate_id: user.id,
    status: 'in_progress',
  }).select().single()

  if (error) {
    console.error('[startExam] Error creating attempt:', error)
    return
  }

  if (attempt) {
    redirect(`/candidate/orgs/${orgId}/exams/${examId}/take`)
  }
}
