'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContestAction(orgId: string, formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  let start_at = formData.get('start_at') as string | null
  let end_at = formData.get('end_at') as string | null

  if (start_at && !start_at.includes('+') && !start_at.includes('Z')) start_at += '+05:30'
  if (end_at && !end_at.includes('+') && !end_at.includes('Z')) end_at += '+05:30'

  const { error } = await sb.from('contests').insert({
    org_id: orgId,
    title: formData.get('title'),
    duration_minutes: Number(formData.get('duration_minutes')),
    start_at: start_at || null,
    end_at: end_at || null,
    status: 'draft'
  })

  if (error) {
    console.error('[createContestAction] Error:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/orgs/${orgId}/contests`)
  return { success: true }
}

export async function deleteContestAction(orgId: string, contestId: string) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await sb.from('contests').delete().eq('id', contestId).eq('org_id', orgId)
  
  if (error) {
    console.error('[deleteContestAction] Error:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/orgs/${orgId}/contests`)
  return { success: true }
}
