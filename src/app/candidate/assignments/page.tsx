import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function CandidateAssignments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Find enrollments
  const { data: enrollments } = await supabase.from('enrollments').select('org_id, orgs(name)').eq('candidate_id', user!.id)
  const orgIds = enrollments?.map(e => e.org_id) || []

  // Find assignments for those orgs
  const { data: assignments } = orgIds.length > 0 
    ? await supabase.from('assignments').select('*, orgs(name)').in('org_id', orgIds)
    : { data: [] }

  // Find my submissions
  const { data: submissions } = await supabase.from('assignment_submissions').select('*').eq('candidate_id', user!.id)
  const submissionMap = new Map(submissions?.map(s => [s.assignment_id, s]))

  async function submitAssignment(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    
    await s.from('assignment_submissions').insert({
      assignment_id: formData.get('assignment_id'),
      candidate_id: user!.id,
      link_url: formData.get('github_url'),
    })
    revalidatePath('/candidate/assignments')
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Assignments</h1>
      </div>

      {assignments?.length === 0 ? (
        <div className="p-8 border border-zinc-800 border-dashed rounded-xl text-center text-zinc-500">
          No assignments available. You need to be enrolled in an organization first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments?.map((a: any) => {
            const sub = submissionMap.get(a.id)
            const isSubmitted = !!sub
            const isLate = new Date() > new Date(a.due_at)

            return (
              <div key={a.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{a.title}</h3>
                    <p className="text-xs text-zinc-500">{a.orgs?.name}</p>
                  </div>
                  {isSubmitted ? (
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-md text-xs font-semibold">Submitted</span>
                  ) : isLate ? (
                    <span className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md text-xs font-semibold">Overdue</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md text-xs font-semibold">Pending</span>
                  )}
                </div>
                
                <p className="text-zinc-400 text-sm mt-4 flex-1 whitespace-pre-wrap">{a.instructions}</p>
                
                <div className="mt-6 pt-4 border-t border-zinc-800/50">
                  <div className="flex justify-between items-center text-xs text-zinc-500 mb-4">
                    <span>Due: {new Date(a.due_at).toLocaleString()}</span>
                    <span>Max Score: {a.max_score}</span>
                  </div>
                  
                  {isSubmitted ? (
                    <div className="p-4 bg-zinc-950 rounded-lg space-y-2">
                      <p className="text-sm text-zinc-300 flex justify-between">
                        <span>Score:</span> 
                        <span className="font-semibold text-white">{sub.score !== null ? `${sub.score} / ${a.max_score}` : 'Pending Grading'}</span>
                      </p>
                      {sub.feedback && (
                        <div className="mt-2 text-sm text-zinc-400">
                          <span className="block font-medium text-zinc-500 mb-1">Feedback:</span>
                          {sub.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <form action={submitAssignment} className="flex gap-2">
                      <input type="hidden" name="assignment_id" value={a.id} />
                      <input name="github_url" required type="url" placeholder="https://github.com/..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm" />
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                        Submit
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
