'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createHackathonAction(orgId: string, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const rules = formData.get('rules') as string
  const due_at = formData.get('due_at') as string
  const min_team_size = parseInt(formData.get('min_team_size') as string, 10)
  const max_team_size = parseInt(formData.get('max_team_size') as string, 10)
  
  const require_github = formData.get('require_github') === 'on'
  const require_video = formData.get('require_video') === 'on'
  const require_app_link = formData.get('require_app_link') === 'on'
  const require_drive_link = formData.get('require_drive_link') === 'on'

  const { error } = await supabase.from('hackathons').insert({
    org_id: orgId,
    title,
    description,
    rules,
    due_at: new Date(due_at).toISOString(),
    min_team_size,
    max_team_size,
    require_github,
    require_video,
    require_app_link,
    require_drive_link,
    status: 'draft'
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/orgs/${orgId}/hackathons`)
  return { success: true }
}

export async function toggleHackathonStatus(orgId: string, hackathonId: string, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'draft' ? 'live' : (currentStatus === 'live' ? 'closed' : 'draft')
  
  const { error } = await supabase.from('hackathons').update({ status: newStatus }).eq('id', hackathonId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/orgs/${orgId}/hackathons`)
  return { success: true }
}
