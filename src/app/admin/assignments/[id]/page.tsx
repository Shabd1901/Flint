import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function AssignmentDetails({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: assignment } = await supabase.from('assignments').select('*').eq('id', params.id).single()
  const { data: submissions } = await supabase.from('assignment_submissions').select('*, profiles(name, email)').eq('assignment_id', params.id)

  async function gradeSubmission(formData: FormData) {
    'use server'
    const s = await createClient()
    await s.from('assignment_submissions')
      .update({
        score: Number(formData.get('score')),
        feedback: formData.get('feedback')
      })
      .eq('id', formData.get('submission_id'))
    
    revalidatePath(`/admin/assignments/${params.id}`)
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{assignment?.title}</h1>
        <p className="text-zinc-400 mt-1">Submissions Overview</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-400">Candidate</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Submission URL</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Submitted At</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Score & Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {submissions?.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-300">
                  {sub.profiles?.name}
                  <div className="text-xs text-zinc-500 mt-0.5">{sub.profiles?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <a href={sub.link_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">{sub.link_url}</a>
                </td>
                <td className="px-6 py-4 text-zinc-400">{new Date(sub.submitted_at).toLocaleString()}</td>
                <td className="px-6 py-4">
                  {sub.score !== null ? (
                    <div className="text-zinc-300">
                      <span className="font-semibold text-white">{sub.score}</span> / {assignment?.max_score}
                      <p className="text-xs text-zinc-500 mt-1">{sub.feedback}</p>
                    </div>
                  ) : (
                    <form action={gradeSubmission} className="flex gap-2 items-start">
                      <input type="hidden" name="submission_id" value={sub.id} />
                      <input name="score" type="number" required max={assignment?.max_score} placeholder="Score" className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 outline-none text-white focus:border-blue-500 transition-colors" />
                      <input name="feedback" type="text" placeholder="Feedback (opt)" className="w-32 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 outline-none text-white focus:border-blue-500 transition-colors" />
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors">Grade</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!submissions || submissions.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
