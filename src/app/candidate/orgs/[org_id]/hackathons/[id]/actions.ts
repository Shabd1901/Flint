'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitHackathonProjectAction(orgId: string, hackathonId: string, teamId: string, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const github_url = (formData.get('github_url') as string) || null
  const video_url = (formData.get('video_url') as string) || null
  const app_url = (formData.get('app_url') as string) || null
  const drive_url = (formData.get('drive_url') as string) || null

  const { error } = await supabase.from('hackathon_submissions').insert({
    hackathon_id: hackathonId,
    team_id: teamId,
    title,
    description,
    github_url,
    video_url,
    app_url,
    drive_url
  })

  if (error) return { error: error.message }

  revalidatePath(`/candidate/orgs/${orgId}/hackathons/${hackathonId}`)
  return { success: true }
}
