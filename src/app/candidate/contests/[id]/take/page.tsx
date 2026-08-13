import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CodeWorkspace } from './CodeWorkspace'
import { ProctoringWrapper } from '@/app/candidate/exams/[id]/take/ProctoringWrapper'
import { logContestViolation, heartbeatContestSession } from './actions'

export default async function ContestTake({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contest } = await supabase.from('contests').select('*').eq('id', id).single()
  const { data: attempt } = await supabase
    .from('contest_attempts')
    .select('*')
    .eq('contest_id', id)
    .eq('candidate_id', user!.id)
    .single()

  if (!attempt || attempt.status !== 'in_progress') {
    redirect('/candidate/contests')
  }

  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .eq('contest_id', id)

  if (!problems || problems.length === 0) {
    return <div className="container-page py-8 text-text-muted">No problems found in this contest.</div>
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50 relative text-sm">
      <ProctoringWrapper attemptId={attempt.id} logAction={logContestViolation} heartbeatAction={heartbeatContestSession} />

      <header className="flex-none h-14 bg-white border-b flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold tracking-tight text-text truncate max-w-sm">{contest?.title}</h1>
          <span className="px-2 py-1 rounded bg-surface-soft text-[10px] font-bold uppercase tracking-wider text-text-muted">Coding Round</span>
        </div>
        <a href="/candidate/contests" className="rounded-md border bg-white px-4 py-1.5 text-xs font-medium hover:bg-surface-soft transition-colors">
          Exit Workspace
        </a>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <CodeWorkspace contestId={id} attemptId={attempt.id} problems={problems} />
      </div>
    </div>
  )
}
