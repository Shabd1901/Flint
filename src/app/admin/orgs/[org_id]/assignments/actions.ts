'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssignmentAction(orgId: string, formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const subTypesRaw = formData.getAll('submission_types').map(String)
  const submission_types = subTypesRaw.length > 0 ? subTypesRaw : ['file', 'link', 'text']

  const allowedTypesRaw = formData.getAll('allowed_file_types').map(String)
  const allowed_file_types = allowedTypesRaw.length > 0 ? allowedTypesRaw : ['pdf', 'csv', 'doc', 'md', 'xlsx']

  const { error } = await sb.from('assignments').insert({
    org_id: orgId,
    title: formData.get('title'),
    instructions: formData.get('instructions'),
    due_at: formData.get('due_at'),
    max_score: Number(formData.get('max_score')),
    submission_types,
    allowed_file_types
  })

  if (error) {
    console.error('[createAssignmentAction] Error inserting assignment:', error)
    throw new Error(error.message)
  }
  revalidatePath(`/admin/orgs/${orgId}/assignments`)
}
