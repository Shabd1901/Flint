import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Download, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

function parseArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
    } catch {
      return [val]
    }
  }
  return []
}

export default async function ExamDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).single()
  const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', id).order('created_at', { ascending: true })
  const { data: attempts } = await supabase.from('exam_attempts').select('*, profiles(name, email), violation_events(*)').eq('exam_id', id).order('started_at', { ascending: false })

  const attemptIds = attempts?.map(a => a.id) || []
  const { data: allAnswers } = attemptIds.length > 0
    ? await supabase.from('exam_answers').select('*').in('attempt_id', attemptIds)
    : { data: [] }

  const answersByAttempt = new Map<string, Map<string, any>>()
  for (const ans of (allAnswers || [])) {
    if (!answersByAttempt.has(ans.attempt_id)) {
      answersByAttempt.set(ans.attempt_id, new Map())
    }
    answersByAttempt.get(ans.attempt_id)!.set(ans.question_id, ans)
  }

  async function addQuestion(formData: FormData) {
    'use server'
    const s = await createClient()
    
    const optionsRaw = formData.get('options') as string
    const options = optionsRaw.split(',').map(o => o.trim()).filter(Boolean)
    
    const correctRaw = formData.get('correct_options') as string
    const correct_options = correctRaw.split(',').map(o => o.trim()).filter(Boolean)

    await s.from('questions').insert({
      exam_id: id,
      text: formData.get('question_text'),
      type: formData.get('type'),
      options: options,
      correct_options: correct_options,
      marks: Number(formData.get('marks')) || 1
    })
    
    revalidatePath(`/admin/exams/${id}`)
  }

  async function updateExamStatus(formData: FormData) {
    'use server'
    const s = await createClient()
    await s.from('exams').update({ status: formData.get('status') }).eq('id', id)
    revalidatePath(`/admin/exams/${id}`)
  }

  async function toggleResultRelease(formData: FormData) {
    'use server'
    const s = await createClient()
    const currentVal = formData.get('current_auto_release') === 'true'
    await s.from('exams').update({ auto_release_results: !currentVal }).eq('id', id)
    revalidatePath(`/admin/exams/${id}`)
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exam?.title}</h1>
          <p className="text-text-muted mt-1">{exam?.description}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <form action={toggleResultRelease}>
            <input type="hidden" name="current_auto_release" value={String(exam?.auto_release_results ?? true)} />
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                exam?.auto_release_results ?? true
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {exam?.auto_release_results ?? true ? (
                <>
                  <Eye size={14} /> Auto-Release Scores: ON
                </>
              ) : (
                <>
                  <EyeOff size={14} /> Scores Held For Review: OFF
                </>
              )}
            </button>
          </form>

          <a
            href={`/api/admin/exams/${id}/export`}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition"
          >
            <Download size={16} />
            Export Shortlist CSV
          </a>

          <form action={updateExamStatus} className="flex gap-2 surface-card p-1.5">
            <select name="status" defaultValue={exam?.status} className="h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm">
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
            </select>
            <button className="rounded-md border bg-white px-4 py-1.5 text-sm font-medium hover:bg-surface-soft">Update Status</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">Questions ({questions?.length || 0})</h2>
          
          <div className="space-y-4">
            {questions?.map((q: any, i: number) => {
              const opts = parseArray(q.options)
              const correct = parseArray(q.correct_options)
              return (
                <div key={q.id} className="surface-card p-5">
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-text-muted">{i + 1}.</span>
                    <div className="space-y-3 flex-1">
                      <p className="font-medium">{q.text}</p>
                      <ul className="space-y-1">
                        {opts?.map((opt: string, idx: number) => (
                          <li key={idx} className={`px-3 py-2 rounded-lg text-sm ${correct?.includes(opt) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' : 'bg-surface-soft text-text-muted'}`}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase bg-surface-soft text-text-muted px-2 py-1 rounded-md">{q.type}</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-semibold">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <form action={addQuestion} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Add Question</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Question Text</label>
              <textarea name="question_text" required rows={3} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Type</label>
              <select name="type" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm">
                <option value="single">Single Choice</option>
                <option value="multi">Multiple Choice</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Options (comma separated)</label>
              <input name="options" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="A, B, C, D" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Correct Options (comma separated)</label>
              <input name="correct_options" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="A, C" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Marks</label>
              <input name="marks" type="number" required defaultValue="1" min="1" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
              Add Question
            </button>
          </form>
        </div>
      </div>

      <div className="pt-6 border-t space-y-4">
        <h2 className="text-xl font-semibold">Candidate Attempts & Response Review</h2>
        <div className="surface-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-surface-soft/40">
                <th className="px-5 py-3 font-medium text-text-muted">Candidate</th>
                <th className="px-5 py-3 font-medium text-text-muted">Status & Score</th>
                <th className="px-5 py-3 font-medium text-text-muted">Time</th>
                <th className="px-5 py-3 font-medium text-text-muted">Integrity Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attempts?.map((attempt: any) => {
                const candidateAnsMap = answersByAttempt.get(attempt.id) || new Map()

                return (
                  <tr key={attempt.id} className="hover:bg-surface-soft/40 transition-colors">
                    <td colSpan={4} className="p-0">
                      <details className="group">
                        <summary className="px-5 py-4 cursor-pointer flex items-center justify-between hover:bg-surface-soft/60 transition-colors list-none">
                          <div className="grid grid-cols-4 w-full items-center gap-4 text-sm">
                            <div className="font-medium">
                              {attempt.profiles?.name}
                              <div className="text-xs text-text-muted mt-0.5">{attempt.profiles?.email}</div>
                            </div>

                            <div>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                                attempt.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
                                attempt.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                                'bg-surface-soft text-text-muted'
                              }`}>
                                {attempt.status}
                              </span>
                              {attempt.score !== null && <div className="mt-1 font-mono font-bold text-accent">Score: {attempt.score}</div>}
                            </div>

                            <div className="text-text-muted text-xs">
                              <div>Started: {new Date(attempt.started_at).toLocaleString()}</div>
                              {attempt.submitted_at && <div>Finished: {new Date(attempt.submitted_at).toLocaleString()}</div>}
                            </div>

                            <div className="flex items-center justify-between">
                              {attempt.violation_events?.length > 0 ? (
                                <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-semibold uppercase">
                                  {attempt.violation_events.length} Violation{attempt.violation_events.length !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-text-muted text-xs">Clean Session</span>
                              )}
                              <span className="text-xs text-accent font-medium group-open:rotate-180 transition-transform">▼ Inspect</span>
                            </div>
                          </div>
                        </summary>

                        {/* Detailed Candidate Response Inspector */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-b space-y-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Question-by-Question Response Review</h4>
                          
                          <div className="space-y-3">
                            {questions?.map((q: any, qIdx: number) => {
                              const userAns = candidateAnsMap.get(q.id)
                              const selected = parseArray(userAns?.selected_options)
                              const correct = parseArray(q.correct_options)
                              const isCorrect = correct.length === selected.length && correct.every((c: string) => selected.includes(c))

                              return (
                                <div key={q.id} className="p-3 bg-white rounded-lg border text-xs space-y-2">
                                  <div className="flex justify-between items-start font-medium">
                                    <span>{qIdx + 1}. {q.text}</span>
                                    {isCorrect ? (
                                      <span className="flex items-center gap-1 text-emerald-600 font-semibold shrink-0">
                                        <CheckCircle2 size={14} /> +{q.marks} pts
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-rose-600 font-semibold shrink-0">
                                        <XCircle size={14} /> 0 pts
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                                    <div className="p-2 rounded bg-surface-soft">
                                      <span className="text-text-muted block font-sans text-[10px] uppercase">Candidate Answer:</span>
                                      <span className={selected.length > 0 ? (isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold') : 'text-text-muted italic'}>
                                        {selected.length > 0 ? selected.join(', ') : 'No Answer Selected'}
                                      </span>
                                    </div>
                                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                      <span className="text-emerald-800 block font-sans text-[10px] uppercase">Correct Answer:</span>
                                      <span className="text-emerald-900 font-semibold">{correct.join(', ')}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                )
              })}
              {(!attempts || attempts.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-muted">No attempts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
