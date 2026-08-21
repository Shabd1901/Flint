'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createTeamAction(orgId: string, hackathonId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = formData.get('name') as string

  // Create team
  const { data: team, error } = await supabase.from('hackathon_teams').insert({
    hackathon_id: hackathonId,
    name,
    leader_id: user!.id
  }).select().single()

  if (error) return { error: error.message }

  // Add leader as member
  const { error: memberError } = await supabase.from('hackathon_team_members').insert({
    team_id: team.id,
    candidate_id: user!.id
  })

  if (memberError) return { error: memberError.message }

  redirect(`/candidate/orgs/${orgId}/hackathons/${hackathonId}`)
}

export async function joinTeamAction(orgId: string, hackathonId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const inviteCode = formData.get('invite_code') as string

  // Find team by code
  const { data: team, error: teamError } = await supabase
    .from('hackathon_teams')
    .select('id, hackathon_id')
    .eq('invite_code', inviteCode)
    .single()

  if (teamError || !team) return { error: 'Invalid invite code or team not found' }
  
  if (team.hackathon_id !== hackathonId) return { error: 'Invite code is for a different hackathon' }

  // Add member
  const { error: memberError } = await supabase.from('hackathon_team_members').insert({
    team_id: team.id,
    candidate_id: user!.id
  })

  if (memberError) return { error: memberError.message }

  redirect(`/candidate/orgs/${orgId}/hackathons/${hackathonId}`)
}
