import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CodeWorkspace } from './CodeWorkspace'
import { ProctoringWrapper } from '@/app/candidate/orgs/[org_id]/exams/[id]/take/ProctoringWrapper'
import { logContestViolation, heartbeatContestSession } from './actions'
import { TbdNotice } from '@/components/TbdNotice'

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

  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .eq('contest_id', id)

  return (
    <TbdNotice
      title="Contest Code Workspace"
      description="The Contest IDE Workspace is tagged as TBD for Version 2 release. All split-pane code editors, real-time leaderboard channels, test case runners, and proctoring locks remain intact."
      backHref="/candidate"
      backLabel="Back to Home"
    />
  )
}
