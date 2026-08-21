'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContestAction(orgId: string, formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await sb.from('contests').insert({
    org_id: orgId,
    title: formData.get('title'),
    duration_minutes: Number(formData.get('duration_minutes')),
    start_at: formData.get('start_at') || null,
    end_at: formData.get('end_at') || null,
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
