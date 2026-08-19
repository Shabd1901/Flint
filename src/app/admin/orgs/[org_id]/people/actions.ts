'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function removeCandidateAction(orgId: string, candidateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify org admin permission
  const { data: org } = await supabase.from('orgs').select('admin_id').eq('id', orgId).single()
  const { data: isCoAdmin } = await supabase.from('org_admins').select('admin_id').eq('org_id', orgId).eq('admin_id', user.id).single()

  if (org?.admin_id !== user.id && !isCoAdmin) {
    return { error: 'Only classroom admins can remove candidates.' }
  }

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('org_id', orgId)
    .eq('candidate_id', candidateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/orgs/${orgId}/people`)
  return { success: 'Candidate removed from classroom.' }
}
