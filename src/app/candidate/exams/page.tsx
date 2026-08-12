import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CandidateExams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Find enrollments
  const { data: enrollments } = await supabase.from('enrollments').select('org_id, orgs(name)').eq('candidate_id', user!.id)
  const orgIds = enrollments?.map(e => e.org_id) || []

  // Find LIVE exams for those orgs
  const { data: exams } = orgIds.length > 0 
    ? await supabase.from('exams').select('*, orgs(name)').in('org_id', orgIds).eq('status', 'live')
    : { data: [] }

  // Find my attempts
  const { data: attempts } = await supabase.from('exam_attempts').select('*').eq('candidate_id', user!.id)
  const attemptMap = new Map(attempts?.map(a => [a.exam_id, a]))

  async function startExam(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    
    const examId = formData.get('exam_id') as string

    // Validate start_at & end_at window
    const { data: ex } = await s.from('exams').select('start_at, end_at, status').eq('id', examId).single()
    if (!ex || ex.status !== 'live') return

    const now = new Date()
    if (ex.start_at && now < new Date(ex.start_at)) return
    if (ex.end_at && now > new Date(ex.end_at)) return

    // Create attempt
    const { data: attempt, error } = await s.from('exam_attempts').insert({
      exam_id: examId,
      candidate_id: user!.id,
      status: 'in_progress',
    }).select().single()

    if (!error && attempt) {
      redirect(`/candidate/exams/${examId}/take`)
    }
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">My Exams</h1>
      </div>

      {exams?.length === 0 ? (
        <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
          No active exams available for your organization.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams?.map((exam: any) => {
            const attempt = attemptMap.get(exam.id)
            const isFinished = attempt && ['submitted', 'auto_submitted'].includes(attempt.status)
            const inProgress = attempt && attempt.status === 'in_progress'

            return (
              <div key={exam.id} className="surface-card p-5 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{exam.title}</h3>
                    <p className="text-xs text-text-muted">{exam.orgs?.name}</p>
                  </div>
                  {isFinished ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Completed</span>
                  ) : inProgress ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold">In Progress</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">Available</span>
                  )}
                </div>
                
                <p className="text-text-muted text-sm mt-3 flex-1">{exam.description}</p>
                
                <div className="mt-5 pt-4 border-t">
                  <div className="flex justify-between items-center text-xs text-text-muted mb-3">
                    <span>Duration: {exam.duration_minutes}m</span>
                  </div>
                  
                  {isFinished ? (
                    <div className="w-full text-center py-2 bg-surface-soft rounded-lg text-sm font-medium text-text-muted">
                      {exam.auto_release_results ?? true ? (
                        attempt.score !== null ? `Score: ${attempt.score}` : 'Pending'
                      ) : (
                        'Submitted — Score Pending Teacher Release'
                      )}
                    </div>
                  ) : inProgress ? (
                    <a href={`/candidate/exams/${exam.id}/take`} className="block w-full text-center py-2 rounded-md bg-amber-500 text-white font-medium hover:bg-amber-600 transition">
                      Resume Exam
                    </a>
                  ) : (
                    <form action={startExam}>
                      <input type="hidden" name="exam_id" value={exam.id} />
                      <button className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition">
                        Start Exam
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
