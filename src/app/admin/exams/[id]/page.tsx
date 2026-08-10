import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function ExamDetails({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: exam } = await supabase.from('exams').select('*').eq('id', params.id).single()
  const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', params.id).order('created_at', { ascending: true })
  const { data: attempts } = await supabase.from('exam_attempts').select('*, profiles(name, email), violation_events(*)').eq('exam_id', params.id).order('started_at', { ascending: false })

  async function addQuestion(formData: FormData) {
    'use server'
    const s = await createClient()
    
    // Parse options: comma separated list to JSON array
    const optionsRaw = formData.get('options') as string
    const options = optionsRaw.split(',').map(o => o.trim()).filter(Boolean)
    
    // Parse correct options
    const correctRaw = formData.get('correct_options') as string
    const correct_options = correctRaw.split(',').map(o => o.trim()).filter(Boolean)

    await s.from('questions').insert({
      exam_id: params.id,
      question_text: formData.get('question_text'),
      type: formData.get('type'),
      options: JSON.stringify(options),
      correct_options: JSON.stringify(correct_options)
    })
    
    revalidatePath(`/admin/exams/${params.id}`)
  }

  async function updateExamStatus(formData: FormData) {
    'use server'
    const s = await createClient()
    await s.from('exams').update({ status: formData.get('status') }).eq('id', params.id)
    revalidatePath(`/admin/exams/${params.id}`)
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
          <p className="text-zinc-400 mt-1">{exam?.description}</p>
        </div>
        <form action={updateExamStatus} className="flex gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
          <select name="status" defaultValue={exam?.status} className="bg-zinc-950 text-white outline-none px-3 py-1 rounded-lg">
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="closed">Closed</option>
          </select>
          <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg">Update</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-zinc-300">Questions ({questions?.length || 0})</h2>
          
          <div className="space-y-4">
            {questions?.map((q: any, i: number) => {
              const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
              const correct = typeof q.correct_options === 'string' ? JSON.parse(q.correct_options) : q.correct_options
              return (
                <div key={q.id} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-zinc-500">{i + 1}.</span>
                    <div className="space-y-3 flex-1">
                      <p className="font-medium text-white">{q.question_text}</p>
                      <ul className="space-y-1">
                        {opts?.map((opt: string, idx: number) => (
                          <li key={idx} className={`px-3 py-2 rounded-lg text-sm ${correct?.includes(opt) ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-950 text-zinc-400'}`}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="text-xs uppercase bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">{q.type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <form action={addQuestion} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 sticky top-8">
            <h2 className="text-lg font-medium text-white mb-4">Add Question</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Question Text</label>
              <textarea name="question_text" required rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
              <select name="type" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500">
                <option value="single">Single Choice</option>
                <option value="multi">Multiple Choice</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Options (comma separated)</label>
              <input name="options" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="A, B, C, D" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Correct Options (comma separated)</label>
              <input name="correct_options" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="A, C" />
            </div>

            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors mt-4">
              Add Question
            </button>
          </form>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-800 space-y-4">
        <h2 className="text-xl font-bold text-white">Candidate Attempts & Proctoring Log</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-400">Candidate</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Status & Score</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Time</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Integrity Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {attempts?.map((attempt: any) => (
                <tr key={attempt.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-300">
                    {attempt.profiles?.name}
                    <div className="text-xs text-zinc-500 mt-0.5">{attempt.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                      attempt.status === 'submitted' ? 'bg-green-500/10 text-green-400' :
                      attempt.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {attempt.status}
                    </span>
                    {attempt.score !== null && <div className="mt-2 text-zinc-300 font-medium">Score: {attempt.score}</div>}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">
                    <div>Started: {new Date(attempt.started_at).toLocaleString()}</div>
                    {attempt.completed_at && <div>Finished: {new Date(attempt.completed_at).toLocaleString()}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {attempt.violation_events?.length > 0 ? (
                      <div className="space-y-2">
                        {attempt.violation_events.map((v: any) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md font-medium uppercase">{v.type}</span>
                            <span className="text-zinc-500">{new Date(v.occurred_at).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs">No violations detected</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!attempts || attempts.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No attempts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
