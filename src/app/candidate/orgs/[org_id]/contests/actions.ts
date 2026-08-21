'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function startContestAction(orgId: string, contestId: string) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  // Validate start_at & end_at window
  const { data: c } = await s.from('contests').select('start_at, end_at, status').eq('id', contestId).single()
  if (!c || c.status !== 'live') return { error: 'Contest is not live' }

  const now = new Date()
  if (c.start_at && now < new Date(c.start_at)) return { error: 'Contest has not started yet' }
  if (c.end_at && now > new Date(c.end_at)) return { error: 'Contest has ended' }

  // Check if attempt already exists
  const { data: existing } = await s.from('contest_attempts').select('id').eq('contest_id', contestId).eq('candidate_id', user.id).single()
  
  if (existing) {
    redirect(`/candidate/orgs/${orgId}/contests/${contestId}/take`)
  }

  // Create new attempt
  const { data: attempt, error } = await s.from('contest_attempts').insert({
    contest_id: contestId,
    candidate_id: user.id,
    status: 'in_progress'
  }).select().single()

  if (error || !attempt) {
    return { error: 'Failed to start contest' }
  }

  redirect(`/candidate/orgs/${orgId}/contests/${contestId}/take`)
}

export async function submitContestAction(orgId: string, contestId: string) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: attempt, error: fetchError } = await sb.from('contest_attempts').select('id, status').eq('contest_id', contestId).eq('candidate_id', user.id).single()
  if (fetchError || !attempt) return { error: 'Attempt not found' }
  if (attempt.status !== 'in_progress') return { error: 'Contest already submitted' }

  const { error } = await sb.from('contest_attempts').update({
    status: 'submitted',
    submitted_at: new Date().toISOString()
  }).eq('id', attempt.id)

  if (error) {
    console.error('[submitContestAction] Error:', error)
    return { error: error.message }
  }

  redirect(`/candidate/orgs/${orgId}/contests`)
}
