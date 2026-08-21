import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { HackathonStatusToggle } from './HackathonStatusToggle'

export default async function AdminHackathonDetails({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()

  const { data: hackathon } = await supabase.from('hackathons').select('*').eq('id', id).single()
  if (!hackathon) return <div>Hackathon not found</div>

  const { data: teams } = await supabase
    .from('hackathon_teams')
    .select('*, hackathon_team_members(profiles(name, email)), hackathon_submissions(*)')
    .eq('hackathon_id', id)

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/orgs/${org_id}/hackathons`} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{hackathon.title} - Overview</h1>
          <p className="text-sm text-text-muted mt-1">Review teams and project submissions.</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
        <div className="text-sm">
          <span className="text-text-muted">Current Status: </span>
          <strong className="capitalize">{hackathon.status}</strong>
        </div>
        <HackathonStatusToggle orgId={org_id} hackathonId={id} initialStatus={hackathon.status} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-muted">Registered Teams ({teams?.length || 0})</h2>
        {teams?.length === 0 ? (
          <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
            No teams have registered yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {teams?.map(team => {
              const members = team.hackathon_team_members || []
              const submission = (team.hackathon_submissions && team.hackathon_submissions.length > 0) ? team.hackathon_submissions[0] : null
              
              return (
                <div key={team.id} className="surface-card p-5 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg border-b pb-2 mb-3">Team: {team.name}</h3>
                    <div className="space-y-2 text-sm text-text-muted">
                      {members.map((m: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span>{m.profiles.name}</span>
                          <span className="text-xs font-mono">{m.profiles.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-l pl-6">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-3">Submission Details</h3>
                    {submission ? (
                      <div className="space-y-2 text-sm">
                        <p><strong>{submission.title}</strong></p>
                        <p className="text-text-muted line-clamp-2">{submission.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
                          {submission.github_url && <a href={submission.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent bg-orange-50 px-2 py-1 rounded hover:underline">GitHub <ExternalLink size={12}/></a>}
                          {submission.video_url && <a href={submission.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent bg-orange-50 px-2 py-1 rounded hover:underline">Video <ExternalLink size={12}/></a>}
                          {submission.app_url && <a href={submission.app_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent bg-orange-50 px-2 py-1 rounded hover:underline">App <ExternalLink size={12}/></a>}
                          {submission.drive_url && <a href={submission.drive_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent bg-orange-50 px-2 py-1 rounded hover:underline">Drive <ExternalLink size={12}/></a>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 text-sm text-text-muted italic bg-surface-soft rounded-lg">
                        No submission yet
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
