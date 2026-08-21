import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CodeWorkspace } from './CodeWorkspace'
import { ProctoringWrapper } from '@/app/candidate/orgs/[org_id]/exams/[id]/take/ProctoringWrapper'
import { logContestViolation, heartbeatContestSession } from './actions'
import { ContestTimer } from '@/components/ContestTimer'
import { SubmitContestButton } from '@/components/SubmitContestButton'

export default async function ContestTake({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contest } = await supabase.from('contests').select('*').eq('id', id).single()
  const { data: attempt } = await supabase
    .from('contest_attempts')
    .select('*')
    .eq('contest_id', id)
    .eq('candidate_id', user.id)
    .single()

  if (!contest || !attempt || attempt.status !== 'in_progress') {
    redirect(`/candidate/orgs/${org_id}/contests`)
  }

  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .eq('contest_id', id)

  return (
    <>
      <ProctoringWrapper 
        attemptId={attempt.id} 
        logAction={logContestViolation} 
        heartbeatAction={heartbeatContestSession}
      />
      <div className="flex flex-col h-screen w-full bg-surface overflow-hidden">
        {/* Contest Header */}
        <header className="h-14 border-b border-line flex items-center justify-between px-4 shrink-0 bg-surface z-10 relative">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-text truncate max-w-xs">{contest.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ContestTimer 
              orgId={org_id} 
              contestId={id} 
              startedAt={attempt.started_at} 
              durationMinutes={contest.duration_minutes} 
            />
            <SubmitContestButton orgId={org_id} contestId={id} />
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden relative">
          <CodeWorkspace problems={problems || []} attemptId={attempt.id} contestId={id} />
        </div>
      </div>
    </>
  )
}
