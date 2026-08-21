import { createClient } from '@/utils/supabase/server'
import { JoinHackathonForms } from './JoinHackathonForms'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function HackathonJoinPage({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: hackathon } = await supabase.from('hackathons').select('*').eq('id', id).single()

  if (!hackathon) return <div>Hackathon not found</div>

  // Check if already in a team
  const { data: teamMember } = await supabase
    .from('hackathon_team_members')
    .select('team_id, hackathon_teams!inner(hackathon_id)')
    .eq('candidate_id', user!.id)
    .eq('hackathon_teams.hackathon_id', id)
    .single()

  if (teamMember) {
    redirect(`/candidate/orgs/${org_id}/hackathons/${id}`)
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-4xl mx-auto">
      <Link href={`/candidate/orgs/${org_id}/hackathons`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition">
        <ArrowLeft size={16} /> Back to Hackathons
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text">{hackathon.title}</h1>
        <p className="mt-2 text-text-muted max-w-2xl">{hackathon.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold tracking-tight text-text mb-4">Create a New Team</h2>
          <JoinHackathonForms orgId={org_id} hackathonId={id} type="create" />
        </div>

        <div className="surface-card p-6 border-accent/20 bg-accent/5">
          <h2 className="text-lg font-semibold tracking-tight text-accent mb-4">Join Existing Team</h2>
          <JoinHackathonForms orgId={org_id} hackathonId={id} type="join" />
        </div>
      </div>
    </div>
  )
}
