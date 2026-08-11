import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CodeWorkspace } from './CodeWorkspace'

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
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contest?.title}</h1>
          <p className="text-xs text-text-muted">In-browser Coding Round Workspace</p>
        </div>

        <a href="/candidate/contests" className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-soft">
          Exit Contest
        </a>
      </div>

      <CodeWorkspace contestId={id} attemptId={attempt.id} problems={problems} />
    </div>
  )
}
