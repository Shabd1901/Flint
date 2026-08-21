import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import Link from 'next/link'
import { Trophy, Users } from 'lucide-react'

export default async function CandidateHackathons({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch hackathons for the org
  const { data: hackathons } = await supabase.from('hackathons').select('*').eq('org_id', org_id).order('created_at', { ascending: false })

  // Find teams the user is in
  const { data: myTeams } = await supabase
    .from('hackathon_team_members')
    .select('team_id, hackathon_teams(hackathon_id)')
    .eq('candidate_id', user!.id)

  const myJoinedHackathonIds = new Set(myTeams?.map((t: any) => t.hackathon_teams.hackathon_id))

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Hackathons</h1>
      </div>

      {hackathons?.length === 0 ? (
        <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
          No hackathons available yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hackathons?.map((h) => {
            const isJoined = myJoinedHackathonIds.has(h.id)
            return (
              <div key={h.id} className="surface-card hover-lift p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-text">{h.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${h.status === 'live' ? 'bg-green-100 text-green-800' : h.status === 'closed' ? 'bg-rose-100 text-rose-800' : 'bg-surface-soft text-text-muted'}`}>
                    {h.status}
                  </span>
                </div>
                
                <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">{h.description}</p>
                
                <div className="space-y-2 mb-4 text-xs text-text-muted">
                  <div className="flex justify-between items-center p-2 rounded bg-surface-soft">
                    <span className="flex items-center gap-1"><Users size={14} /> Team Size</span>
                    <span className="font-mono font-medium">{h.min_team_size} - {h.max_team_size}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-surface-soft">
                    <span className="flex items-center gap-1"><Trophy size={14} /> Deadline</span>
                    <span className="font-mono font-medium">{formatDateTime(h.due_at)}</span>
                  </div>
                </div>

                {isJoined ? (
                  <Link href={`/candidate/orgs/${org_id}/hackathons/${h.id}`} className="w-full h-10 flex items-center justify-center rounded-md bg-accent text-white font-medium hover:bg-accent-strong transition">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link href={`/candidate/orgs/${org_id}/hackathons/${h.id}/join`} className="w-full h-10 flex items-center justify-center rounded-md border border-accent text-accent font-medium hover:bg-orange-50 transition">
                    Form or Join Team
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
