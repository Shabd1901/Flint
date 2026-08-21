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

export async function bulkUploadRosterAction(orgId: string, candidates: { email: string; name: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify org admin permission
  const { data: org } = await supabase.from('orgs').select('admin_id').eq('id', orgId).single()
  const { data: isCoAdmin } = await supabase.from('org_admins').select('admin_id').eq('org_id', orgId).eq('admin_id', user.id).single()

  if (org?.admin_id !== user.id && !isCoAdmin) {
    return { error: 'Only classroom admins can invite candidates.' }
  }

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  let added = 0
  let invited = 0

  for (const c of candidates) {
    if (!c.email) continue

    // 1. Try to find if user exists by email using Admin API
    const { data: { users } } = await adminClient.auth.admin.listUsers()
    let userId = users.find(u => u.email === c.email)?.id

    if (!userId) {
      // Invite user (this sends the email and creates the user in auth.users)
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(c.email, {
        data: { name: c.name }
      })
      if (!inviteError && inviteData.user) {
        userId = inviteData.user.id
        invited++
        
        // Also ensure profile exists immediately
        await adminClient.from('profiles').upsert({
          id: userId,
          email: c.email,
          name: c.name,
          role: 'candidate'
        })
      }
    }

    if (userId) {
      // Ensure they are enrolled
      const { error: enrollError } = await adminClient.from('enrollments').upsert({
        org_id: orgId,
        candidate_id: userId
      }, { onConflict: 'org_id,candidate_id' })
      if (!enrollError) {
        added++
      }
    }
  }

  revalidatePath(`/admin/orgs/${orgId}/people`)
  return { success: `Successfully processed! Invited ${invited} new users and enrolled ${added} total candidates.` }
}
