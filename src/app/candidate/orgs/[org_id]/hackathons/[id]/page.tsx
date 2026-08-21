import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, Share2 } from 'lucide-react'
import { SubmitHackathonForm } from './SubmitHackathonForm'

export default async function CandidateHackathonDashboard({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify the hackathon exists
  const { data: hackathon } = await supabase.from('hackathons').select('*').eq('id', id).single()
  if (!hackathon) return <div>Hackathon not found</div>

  // Verify candidate is in a team
  const { data: teamMember } = await supabase
    .from('hackathon_team_members')
    .select('team_id, hackathon_teams!inner(*)')
    .eq('candidate_id', user!.id)
    .eq('hackathon_teams.hackathon_id', id)
    .single()

  if (!teamMember) {
    redirect(`/candidate/orgs/${org_id}/hackathons/${id}/join`)
  }

  const team = teamMember.hackathon_teams as any
  const isLeader = team.leader_id === user!.id

  // Get team members
  const { data: members } = await supabase
    .from('hackathon_team_members')
    .select('profiles(name, email)')
    .eq('team_id', team.id)

  // Get submission
  const { data: submission } = await supabase
    .from('hackathon_submissions')
    .select('*')
    .eq('team_id', team.id)
    .single()

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-5xl mx-auto">
      <Link href={`/candidate/orgs/${org_id}/hackathons`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition">
        <ArrowLeft size={16} /> Back to Hackathons
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">{hackathon.title}</h1>
          <p className="mt-2 text-text-muted max-w-2xl">{hackathon.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Submission Deadline</p>
          <p className="font-mono text-lg font-semibold mt-1">{formatDateTime(hackathon.due_at)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          
          {hackathon.rules && (
            <div className="surface-card p-6 border-l-4 border-l-accent">
              <h3 className="font-semibold text-lg mb-2">Rules & Guidelines</h3>
              <p className="text-sm text-text-muted whitespace-pre-wrap">{hackathon.rules}</p>
            </div>
          )}

          {submission ? (
            <div className="surface-card p-6 border border-green-200 bg-green-50/30">
              <div className="flex items-center gap-2 text-green-700 mb-4">
                <CheckCircle2 size={24} />
                <h3 className="font-semibold text-lg">Project Submitted</h3>
              </div>
              <div className="space-y-3">
                <p><strong>Title:</strong> {submission.title}</p>
                <p className="text-sm text-text-muted">{submission.description}</p>
                {submission.github_url && <p className="text-sm"><a href={submission.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">GitHub Repository</a></p>}
                {submission.video_url && <p className="text-sm"><a href={submission.video_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">Demo Video</a></p>}
                {submission.app_url && <p className="text-sm"><a href={submission.app_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">Live Application</a></p>}
                {submission.drive_url && <p className="text-sm"><a href={submission.drive_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">Drive Folder</a></p>}
              </div>
            </div>
          ) : (
            isLeader ? (
              <SubmitHackathonForm orgId={org_id} hackathonId={id} teamId={team.id} hackathon={hackathon} />
            ) : (
              <div className="surface-card p-6 flex flex-col items-center text-center justify-center border-dashed">
                <AlertCircle size={48} className="text-amber-500 mb-4" />
                <h3 className="font-semibold text-lg">Waiting for Submission</h3>
                <p className="text-sm text-text-muted mt-2 max-w-sm">
                  Only the team leader ({members?.find((m: any) => m.profiles.email === user?.email)?.profiles?.name || 'your leader'}) can submit the final project links.
                </p>
              </div>
            )
          )}

        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="font-semibold text-text">Team: {team.name}</h3>
            </div>
            
            <div className="space-y-3">
              {members?.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-soft flex items-center justify-center text-xs font-bold text-text-muted">
                    {m.profiles.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{m.profiles.name} {m.profiles.email === user?.email && '(You)'}</p>
                    <p className="text-[10px] text-text-muted">{m.profiles.email}</p>
                  </div>
                </div>
              ))}
            </div>

            {isLeader && !submission && (
              <div className="mt-6 pt-4 border-t border-line">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Team Invite Code</p>
                <div className="flex items-center justify-between p-2 rounded bg-surface-soft font-mono text-sm border border-line">
                  {team.invite_code}
                  <Share2 size={16} className="text-text-muted" />
                </div>
                <p className="text-[10px] text-text-muted mt-2">Share this code with members so they can join your team.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
