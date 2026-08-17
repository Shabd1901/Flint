import { createClient } from '@/utils/supabase/server'
import { Download, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft, BarChart2, Radio, History } from 'lucide-react'
import { formatDateTime } from '@/utils/formatDate'
import { QuestionManager } from './QuestionManager'
import { ExamSettingsEditor } from './ExamSettingsEditor'
import { updateExamStatus, toggleResultRelease, gradeExamAnswer } from './actions'
import { DeleteExamButton } from './DeleteExamButton'
import Link from 'next/link'
import { evaluateAnswer } from '@/utils/grade'
import { shuffleArray } from '@/utils/random'


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

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      {/* Breadcrumb */}
      <Link href="/admin/exams" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Exams
      </Link>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exam?.title}</h1>
          <p className="text-text-muted mt-1">{exam?.description}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-muted">
            <span>Duration: {exam?.duration_minutes}m</span>
            {exam?.negative_marking && (
              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded font-semibold uppercase">Neg. Marking</span>
            )}
            {exam?.randomize && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-semibold uppercase">Randomized</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Result Release Toggle */}
          <form action={toggleResultRelease.bind(null, id, exam?.auto_release_results ?? true)}>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                exam?.auto_release_results ?? true
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {exam?.auto_release_results ?? true ? (
                <><Eye size={14} /> Auto-Release: ON</>
              ) : (
                <><EyeOff size={14} /> Scores Held</>
              )}
            </button>
          </form>

          {/* Export CSV */}
          <a
            href={`/api/admin/exams/${id}/export`}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition"
          >
            <Download size={16} />
            Export CSV
          </a>

          {/* Audit Trail */}
          <Link
            href={`/admin/exams/${id}/audit`}
            className="inline-flex items-center gap-2 rounded-md bg-white border px-4 py-2 text-sm font-semibold hover:bg-surface-soft transition"
          >
            <History size={16} />
            Audit Log
          </Link>

          {/* Item Analysis */}
          <Link
            href={`/admin/exams/${id}/analysis`}
            className="inline-flex items-center gap-2 rounded-md bg-white border px-4 py-2 text-sm font-semibold hover:bg-surface-soft transition"
          >
            <BarChart2 size={16} />
            Item Analysis
          </Link>

          {/* Live Proctor Console */}
          <Link
            href={`/admin/exams/${id}/proctor`}
            className="inline-flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 text-sm font-semibold hover:bg-rose-100 transition"
          >
            <Radio size={16} className="animate-pulse" />
            Live Proctor Console
          </Link>

          {/* Status Dropdown */}
          <form action={async (fd: FormData) => {
            'use server'
            await updateExamStatus(id, fd.get('status') as string)
          }} className="flex gap-2 surface-card p-1.5">
            <select name="status" defaultValue={exam?.status} className="h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm">
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
            </select>
            <button className="rounded-md border bg-white px-4 py-1.5 text-sm font-medium hover:bg-surface-soft">Update</button>
          </form>

          {/* Delete Exam */}
          <DeleteExamButton examId={id} />
        </div>
      </div>

      {/* Exam Settings Editor */}
      {exam && (
        <ExamSettingsEditor exam={{
          id: exam.id,
          title: exam.title,
          description: exam.description || '',
          duration_minutes: exam.duration_minutes,
          start_at: exam.start_at,
          end_at: exam.end_at,
          negative_marking: exam.negative_marking,
          randomize: exam.randomize,
        }} />
      )}

      {/* Question Manager */}
      <QuestionManager questions={questions || []} examId={id} />

      {/* Candidate Attempts & Response Review */}
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

                            <div className="text-text-muted text-xs" suppressHydrationWarning>
                              <div>Started: {formatDateTime(attempt.started_at)}</div>
                              {attempt.submitted_at && <div>Finished: {formatDateTime(attempt.submitted_at)}</div>}
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
                            {(() => {
                              const candQuestions = exam?.randomize ? shuffleArray([...(questions || [])], attempt.id) : questions
                              return candQuestions?.map((q: any, qIdx: number) => {
                              const userAns = candidateAnsMap.get(q.id)
                              const { isCorrect, candDisplay, correctDisplay } = evaluateAnswer(q, userAns)

                              return (
                                <div key={q.id} className="p-3 bg-white rounded-lg border text-xs space-y-2">
                                  <div className="flex justify-between items-start font-medium">
                                    <span>{qIdx + 1}. {q.text} <span className="text-[10px] uppercase bg-surface-soft px-1.5 py-0.5 rounded ml-2">{q.type.replace('_', ' ')}</span></span>
                                    {isCorrect ? (
                                      <span className="flex items-center gap-1 text-emerald-600 font-semibold shrink-0">
                                        <CheckCircle2 size={14} /> +{q.marks} pts
                                      </span>
                                    ) : (q.type === 'long_answer' || q.type === 'file_upload') ? (
                                      userAns?.id ? (
                                        <form action={gradeExamAnswer} className="flex items-center gap-2">
                                          <input type="hidden" name="answer_id" value={userAns.id} />
                                          <input type="hidden" name="attempt_id" value={attempt.id} />
                                          <input type="hidden" name="exam_id" value={id} />
                                          <div className="flex items-center gap-1">
                                            <input 
                                              type="number" 
                                              name="marks" 
                                              defaultValue={userAns.marks_awarded ?? ''}
                                              max={q.marks} 
                                              min={0} 
                                              step="0.5" 
                                              required
                                              className="w-16 px-2 py-1 text-xs rounded border outline-none focus:border-accent bg-white"
                                              placeholder={`/${q.marks}`}
                                            />
                                            <span className="text-text-muted text-xs font-semibold">/ {q.marks}</span>
                                          </div>
                                          <button type="submit" className="px-3 py-1 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-strong transition">Save</button>
                                        </form>
                                      ) : (
                                        <span className="flex items-center gap-1 text-rose-600 font-semibold shrink-0">
                                          <XCircle size={14} /> 0 pts (No Answer)
                                        </span>
                                      )
                                    ) : (
                                      <span className="flex items-center gap-1 text-rose-600 font-semibold shrink-0">
                                        <XCircle size={14} /> 0 pts
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                                    <div className="p-2 rounded bg-surface-soft">
                                      <span className="text-text-muted block font-sans text-[10px] uppercase">Candidate Answer:</span>
                                      {q.type === 'file_upload' && userAns?.file_url ? (
                                        <a href={userAns.file_url} target="_blank" className="text-accent hover:underline font-semibold flex items-center gap-1 mt-1">Download File</a>
                                      ) : (
                                        <span className={candDisplay !== 'No Answer' && candDisplay !== 'No Answer Selected' ? ((isCorrect || q.type === 'long_answer') ? 'text-emerald-700 font-semibold whitespace-pre-wrap' : 'text-rose-700 font-semibold whitespace-pre-wrap') : 'text-text-muted italic'}>
                                          {candDisplay}
                                        </span>
                                      )}
                                    </div>
                                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                      <span className="text-emerald-800 block font-sans text-[10px] uppercase">Correct Answer / Criteria:</span>
                                      <span className="text-emerald-900 font-semibold">{correctDisplay}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                            })()}
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
