import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Trophy, ShieldAlert, Clock, FileText } from 'lucide-react'
import { formatDateTime } from '@/utils/formatDate'
import { gradeExamAnswer } from '../../actions'

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

export default async function CandidateAttemptReviewPage({
  params,
}: {
  params: Promise<{ org_id: string; id: string; attempt_id: string }>
}) {
  const { org_id, id, attempt_id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).single()
  if (!exam) notFound()

  const { data: attempt } = await adminClient
    .from('exam_attempts')
    .select('*, profiles(name, email)')
    .eq('id', attempt_id)
    .single()

  if (!attempt) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', id)
    .order('created_at', { ascending: true })

  const { data: answers } = await supabase
    .from('exam_answers')
    .select('*')
    .eq('attempt_id', attempt_id)

  const candidateAnsMap = new Map<string, any>(answers?.map((a) => [a.question_id, a]) || [])

  // Calculate total possible marks
  const totalPossibleMarks = questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <Link
        href={`/admin/orgs/${org_id}/exams/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition font-medium"
      >
        <ArrowLeft size={14} />
        Back to Exam Results
      </Link>

      {/* Candidate Score Summary Card */}
      <div className="surface-card p-6 md:p-8 space-y-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Candidate Response Review
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
              {(attempt.profiles as any)?.name || (attempt.profiles as any)?.email || 'Candidate'}
            </h1>
            <p className="text-xs text-text-muted mt-0.5 font-mono">
              {(attempt.profiles as any)?.email}
            </p>
            <p className="text-sm text-text mt-2 font-medium">
              Exam: <span className="font-semibold text-accent">{exam.title}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-2">
              <Trophy size={20} className="text-accent" />
              <div>
                <div className="text-[10px] uppercase font-bold text-text-muted">Total Score</div>
                <div className="text-xl font-bold font-mono text-accent">
                  {attempt.score ?? 0} <span className="text-xs text-text-muted">/ {totalPossibleMarks} pts</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                  attempt.status === 'submitted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : attempt.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-surface-soft text-text-muted'
                }`}
              >
                {attempt.status}
              </span>

              {(attempt.violation_score || 0) > 0 ? (
                <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-md text-xs font-bold uppercase border border-rose-200 flex items-center gap-1">
                  <ShieldAlert size={12} />
                  {attempt.violation_score} Flag{attempt.violation_score !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold uppercase border border-emerald-200">
                  Clean Session
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-text-muted pt-1">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-accent shrink-0" />
            <span>Started: <strong className="text-text font-mono" suppressHydrationWarning>{formatDateTime(attempt.started_at)}</strong></span>
          </div>
          {attempt.submitted_at && (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Finished: <strong className="text-text font-mono" suppressHydrationWarning>{formatDateTime(attempt.submitted_at)}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-purple-600 shrink-0" />
            <span>Questions: <strong className="text-text font-mono">{questions?.length || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Question-by-Question Response Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-text">
          Question-by-Question Response Breakdown
        </h2>

        <div className="space-y-4">
          {questions?.map((q: any, qIdx: number) => {
            const userAns = candidateAnsMap.get(q.id)

            let isCorrect = false
            let candDisplay = 'No Answer'
            let correctDisplay = 'N/A'

            if (q.type === 'single' || q.type === 'multi') {
              const selected = parseArray(userAns?.selected_options)
              const correct = parseArray(q.correct_options)
              isCorrect =
                correct.length > 0 &&
                correct.length === selected.length &&
                correct.every((c: string) => selected.includes(c))
              candDisplay = selected.length > 0 ? selected.join(', ') : 'No Answer Selected'
              correctDisplay = correct.join(', ')
            } else if (q.type === 'true_false') {
              const selected = parseArray(userAns?.selected_options)[0]
              const correct = parseArray(q.correct_options)[0]
              isCorrect = !!correct && !!selected && correct === selected
              candDisplay = selected || 'No Answer'
              correctDisplay = correct || 'N/A'
            } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
              isCorrect = !!(
                q.correct_text &&
                userAns?.text_answer &&
                q.correct_text.trim().toLowerCase() === userAns.text_answer.trim().toLowerCase()
              )
              candDisplay = userAns?.text_answer || 'No Answer'
              correctDisplay = q.correct_text || 'N/A'
            } else if (q.type === 'numerical') {
              if (
                q.correct_number !== null &&
                userAns?.number_answer !== null &&
                userAns?.number_answer !== undefined
              ) {
                const diff = Math.abs(q.correct_number - userAns.number_answer)
                isCorrect = diff <= (q.tolerance || 0)
              }
              candDisplay = userAns?.number_answer?.toString() || 'No Answer'
              correctDisplay = `${q.correct_number ?? 'N/A'} ± ${q.tolerance ?? 0}`
            } else if (q.type === 'long_answer') {
              isCorrect = false
              candDisplay = userAns?.text_answer || 'No Answer'
              correctDisplay =
                userAns?.marks_awarded !== undefined && userAns?.marks_awarded !== null
                  ? `Graded: ${userAns.marks_awarded} pts`
                  : 'Manual Grade Required'
            } else if (q.type === 'file_upload') {
              isCorrect = false
              candDisplay = userAns?.file_url ? 'File Uploaded' : 'No File'
              correctDisplay =
                userAns?.marks_awarded !== undefined && userAns?.marks_awarded !== null
                  ? `Graded: ${userAns.marks_awarded} pts`
                  : 'Manual Grade Required'
            }

            return (
              <div key={q.id} className="surface-card p-5 space-y-3 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div className="font-semibold text-text text-sm">
                    {qIdx + 1}. {q.text}
                    <span className="text-[10px] font-bold uppercase bg-surface-soft px-2 py-0.5 rounded ml-2 border">
                      {q.type.replace('_', ' ')}
                    </span>
                  </div>

                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-bold text-xs shrink-0">
                      <CheckCircle2 size={14} /> +{q.marks} pts
                    </span>
                  ) : q.type === 'long_answer' || q.type === 'file_upload' ? (
                    userAns?.id ? (
                      <form action={gradeExamAnswer} className="flex items-center gap-2 shrink-0">
                        <input type="hidden" name="answer_id" value={userAns.id} />
                        <input type="hidden" name="attempt_id" value={attempt.id} />
                        <input type="hidden" name="exam_id" value={id} />
                        <input type="hidden" name="org_id" value={org_id} />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            name="marks"
                            defaultValue={userAns.marks_awarded ?? ''}
                            max={q.marks}
                            min={0}
                            step="0.5"
                            required
                            className="w-16 px-2 py-1 text-xs rounded border outline-none focus:ring-2 focus:ring-accent bg-white font-semibold"
                            placeholder={`/${q.marks}`}
                          />
                          <span className="text-text-muted text-xs font-semibold">/ {q.marks}</span>
                        </div>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-accent text-white rounded-md text-xs font-semibold hover:bg-accent-strong transition"
                        >
                          Save Grade
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md font-bold text-xs shrink-0">
                        <XCircle size={14} /> 0 pts (No Answer)
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md font-bold text-xs shrink-0">
                      <XCircle size={14} /> 0 pts
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-surface-soft/60 border space-y-1">
                    <span className="text-text-muted block font-sans text-[10px] font-bold uppercase tracking-wider">
                      Candidate Response:
                    </span>
                    {q.type === 'file_upload' && userAns?.file_url ? (
                      <a
                        href={userAns.file_url}
                        target="_blank"
                        className="text-accent hover:underline font-semibold flex items-center gap-1 mt-1 text-xs"
                      >
                        Download File
                      </a>
                    ) : (
                      <span
                        className={
                          candDisplay !== 'No Answer' && candDisplay !== 'No Answer Selected'
                            ? isCorrect || q.type === 'long_answer'
                              ? 'text-emerald-800 font-semibold whitespace-pre-wrap'
                              : 'text-rose-800 font-semibold whitespace-pre-wrap'
                            : 'text-text-muted italic'
                        }
                      >
                        {candDisplay}
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
                    <span className="text-emerald-800 block font-sans text-[10px] font-bold uppercase tracking-wider">
                      Correct Answer / Criteria:
                    </span>
                    <span className="text-emerald-950 font-semibold">{correctDisplay}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
