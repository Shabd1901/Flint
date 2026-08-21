import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { formatDateTime } from '@/utils/formatDate'
import { StartContestButton } from './StartContestButton'

export default async function CandidateContests({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify enrollment
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('org_id', org_id).eq('candidate_id', user.id).single()
  if (!enrollment) redirect('/candidate')

  // Find LIVE contests for this org
  const { data: contests } = await supabase.from('contests').select('*, orgs(name)').eq('org_id', org_id).eq('status', 'live')

  // Find my attempts
  const { data: attempts } = await supabase.from('contest_attempts').select('*').eq('candidate_id', user.id)
  const attemptMap = new Map(attempts?.map(a => [a.contest_id, a]))

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/candidate/orgs/${org_id}`} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coding Contests</h1>
          <p className="text-sm text-text-muted mt-1">Participate in live algorithmic programming challenges.</p>
        </div>
      </div>

      {contests?.length === 0 ? (
        <div className="p-12 border border-line border-dashed rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center mb-4">
            <Clock className="text-text-muted" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-text mb-1">No Active Contests</h2>
          <p className="text-text-muted max-w-sm">
            There are currently no live coding contests available for this classroom. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests?.map((c) => {
            const attempt = attemptMap.get(c.id)
            const isCompleted = attempt && attempt.status !== 'in_progress'
            const isStarted = attempt && attempt.status === 'in_progress'

            return (
              <div key={c.id} className="surface-card p-6 flex flex-col h-full hover-lift">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-text leading-tight">{c.title}</h3>
                    {isCompleted ? (
                      <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md uppercase tracking-wider">Completed</span>
                    ) : isStarted ? (
                      <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-md uppercase tracking-wider">In Progress</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-md uppercase tracking-wider">Live Now</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Clock size={16} />
                      <span>{c.duration_minutes} minutes</span>
                    </div>
                    {c.start_at && (
                      <div className="flex items-center gap-2 text-sm text-text-muted" suppressHydrationWarning>
                        <Calendar size={16} />
                        <span>Ends: {formatDateTime(c.end_at || c.start_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-line flex justify-end">
                  {isCompleted ? (
                    <button disabled className="btn-secondary opacity-50 cursor-not-allowed">Submitted</button>
                  ) : (
                    <StartContestButton orgId={org_id} contestId={c.id} label={isStarted ? 'Resume Contest' : 'Start Contest'} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
