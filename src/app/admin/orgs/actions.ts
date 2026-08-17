'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createOrg(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name = formData.get('name') as string
  if (!name) return

  await supabase.from('orgs').insert({
    admin_id: user.id,
    name
  })

  revalidatePath('/admin/orgs')
}

export async function updateOrg(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  if (!id || !name) return

  await supabase.from('orgs').update({ name }).eq('id', id)
  revalidatePath('/admin/orgs')
}

export async function deleteOrg(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return

  await supabase.from('orgs').delete().eq('id', id)
  revalidatePath('/admin/orgs')
}

export async function bulkInviteCandidates(orgId: string, emails: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const adminClient = createAdminClient()
  
  for (const email of emails) {
    if (!email) continue
    
    // Check if user already exists
    let candidateId = null
    const { data: existingProfiles } = await adminClient.from('profiles').select('id').eq('email', email)
    if (existingProfiles && existingProfiles.length > 0) {
      candidateId = existingProfiles[0].id
    } else {
      // Create user via Admin API (sends an invite email)
      const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(email)
      if (inviteData?.user) {
        candidateId = inviteData.user.id
      }
    }

    if (candidateId) {
      // Insert enrollment (will fail silently if unique constraint triggers, which is fine)
      await adminClient.from('enrollments').insert({
        org_id: orgId,
        candidate_id: candidateId
      }).select().single().catch(() => null)
    }
  }

  revalidatePath(`/admin/orgs/${orgId}`)
}
