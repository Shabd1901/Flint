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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Exams</h1>
      </div>

      {exams?.length === 0 ? (
        <div className="p-8 border border-zinc-800 border-dashed rounded-xl text-center text-zinc-500">
          No active exams available for your organization.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams?.map((exam: any) => {
            const attempt = attemptMap.get(exam.id)
            const isFinished = attempt && ['submitted', 'auto_submitted'].includes(attempt.status)
            const inProgress = attempt && attempt.status === 'in_progress'

            return (
              <div key={exam.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{exam.title}</h3>
                    <p className="text-xs text-zinc-500">{exam.orgs?.name}</p>
                  </div>
                  {isFinished ? (
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-md text-xs font-semibold">Completed</span>
                  ) : inProgress ? (
                    <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-md text-xs font-semibold">In Progress</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-semibold">Available</span>
                  )}
                </div>
                
                <p className="text-zinc-400 text-sm mt-4 flex-1">{exam.description}</p>
                
                <div className="mt-6 pt-4 border-t border-zinc-800/50">
                  <div className="flex justify-between items-center text-xs text-zinc-500 mb-4">
                    <span>Duration: {exam.duration_minutes}m</span>
                  </div>
                  
                  {isFinished ? (
                    <div className="w-full text-center py-2 bg-zinc-950 text-zinc-400 rounded-lg text-sm font-medium">
                      Score: {attempt.score !== null ? attempt.score : 'Pending'}
                    </div>
                  ) : inProgress ? (
                    <a href={`/candidate/exams/${exam.id}/take`} className="block w-full text-center py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors">
                      Resume Exam
                    </a>
                  ) : (
                    <form action={startExam}>
                      <input type="hidden" name="exam_id" value={exam.id} />
                      <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors">
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
