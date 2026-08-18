import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CandidateContests({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify enrollment
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('org_id', org_id).eq('candidate_id', user!.id).single()
  if (!enrollment) redirect('/candidate')

  // Find LIVE contests for this org
  const { data: contests } = await supabase.from('contests').select('*, orgs(name)').eq('org_id', org_id).eq('status', 'live')

  // Find my attempts
  const { data: attempts } = await supabase.from('contest_attempts').select('*').eq('candidate_id', user!.id)
  const attemptMap = new Map(attempts?.map(a => [a.contest_id, a]))

  async function startContest(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()

    const contestId = formData.get('contest_id') as string

    // Validate start_at & end_at window
    const { data: c } = await s.from('contests').select('start_at, end_at, status').eq('id', contestId).single()
    if (!c || c.status !== 'live') return

    const now = new Date()
    if (c.start_at && now < new Date(c.start_at)) return
    if (c.end_at && now > new Date(c.end_at)) return

    // Create attempt
    const { data: attempt, error } = await s.from('contest_attempts').insert({
      contest_id: contestId,
      candidate_id: user!.id,
      status: 'in_progress'
    }).select().single()

    if (!error && attempt) {
      redirect(`/candidate/orgs/${org_id}/contests/${contestId}/take`)
    }
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <Link href={`/candidate/orgs/${org_id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Classroom
      </Link>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">My Coding Contests</h1>
      </div>

      {contests?.length === 0 ? (
        <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
          No active coding contests available for your organization.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contests?.map((contest: any) => {
            const attempt = attemptMap.get(contest.id)
            const isFinished = attempt && ['submitted', 'auto_submitted'].includes(attempt.status)
            const inProgress = attempt && attempt.status === 'in_progress'

            return (
              <div key={contest.id} className="surface-card p-5 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{contest.title}</h3>
                    <p className="text-xs text-text-muted">{contest.orgs?.name}</p>
                  </div>
                  {isFinished ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Completed</span>
                  ) : inProgress ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold">In Progress</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">Available</span>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t">
                  <div className="flex justify-between items-center text-xs text-text-muted mb-3">
                    <span>Duration: {contest.duration_minutes}m</span>
                  </div>

                  {isFinished ? (
                    <div className="w-full text-center py-2 bg-surface-soft rounded-lg text-sm font-medium text-text-muted">
                      Contest Completed
                    </div>
                  ) : inProgress ? (
                    <a href={`/candidate/orgs/${org_id}/contests/${contest.id}/take`} className="block w-full text-center py-2 rounded-md bg-amber-500 text-white font-medium hover:bg-amber-600 transition">
                      Enter Coding Workspace
                    </a>
                  ) : (
                    <form action={startContest}>
                      <input type="hidden" name="contest_id" value={contest.id} />
                      <button className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition">
                        Start Contest
                      </button>
                    </form>
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
