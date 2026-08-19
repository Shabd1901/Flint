import { createClient } from '@/utils/supabase/server'
import { Download, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft, ShieldAlert } from 'lucide-react'
import { formatDateTime } from '@/utils/formatDate'
import { QuestionManager } from './QuestionManager'
import { ExamSettingsEditor } from './ExamSettingsEditor'
import { updateExamStatus, toggleResultRelease, gradeExamAnswer } from './actions'
import { DeleteExamButton } from './DeleteExamButton'
import { AutoReleaseToggle } from './AutoReleaseToggle'
import { StatusUpdateForm } from './StatusUpdateForm'
import Link from 'next/link'

const VIOLATION_MAP: Record<string, { label: string; description: string; color: string }> = {
  tab_switch: { label: 'Tab Switch', description: 'Switched tabs or minimized browser window', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  blur: { label: 'Lost Focus', description: 'Window lost focus / switched to external desktop application', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  fullscreen_exit: { label: 'Fullscreen Exit', description: 'Exited enforced full-screen container', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  devtools: { label: 'DevTools Opened', description: 'Opened browser developer tools inspection panel', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  multi_session: { label: 'Concurrent Session', description: 'Opened attempt on multiple windows/devices', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  copy_paste_blocked: { label: 'Copy/Paste Attempt', description: 'Attempted forbidden copy/paste action', color: 'bg-amber-100 text-amber-800 border-amber-200' },
}

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

export default async function ExamDetails({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
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
      <Link href={`/admin/orgs/${org_id}/exams`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
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
          <AutoReleaseToggle examId={id} orgId={org_id} initialValue={exam?.auto_release_results ?? true} />

          {/* Export CSV */}
          <a
            href={`/api/admin/exams/${id}/export`}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition"
          >
            <Download size={16} />
            Export CSV
          </a>

          {/* Status Dropdown */}
          <StatusUpdateForm examId={id} orgId={org_id} currentStatus={exam?.status || 'draft'} />

          {/* Delete Exam */}
          <DeleteExamButton examId={id} orgId={org_id} />
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
        }} orgId={org_id} />
      )}

      {/* Question Manager */}
      <QuestionManager questions={questions || []} examId={id} orgId={org_id} />

      {/* Candidate Attempts & Response Review */}
      <div className="pt-6 border-t space-y-4">
        <h2 className="text-xl font-semibold">Candidate Attempts & Proctoring Audit</h2>
        <div className="surface-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-surface-soft/40">
                <th className="px-5 py-3 font-medium text-text-muted">Candidate</th>
                <th className="px-5 py-3 font-medium text-text-muted">Status & Score</th>
                <th className="px-5 py-3 font-medium text-text-muted">Time</th>
                <th className="px-5 py-3 font-medium text-text-muted">Proctoring Violations & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attempts?.map((attempt: any) => {
                return (
                  <tr key={attempt.id} className="hover:bg-surface-soft/40 transition-colors">
                    <td colSpan={4} className="p-0">
                      <details className="group">
                        <summary className="px-5 py-4 cursor-pointer flex items-center justify-between hover:bg-surface-soft/60 transition-colors list-none">
                          <div className="grid grid-cols-1 md:grid-cols-4 w-full items-center gap-4 text-sm">
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

                            <div className="flex items-center justify-between gap-3">
                              {attempt.violation_events?.length > 0 ? (
                                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-md text-xs font-bold uppercase tracking-wider border border-rose-200">
                                  {attempt.violation_events.length} Violation{attempt.violation_events.length !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold uppercase tracking-wider border border-emerald-200">
                                  Clean Session
                                </span>
                              )}

                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/orgs/${org_id}/exams/${id}/attempts/${attempt.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white font-semibold text-xs hover:bg-accent-strong transition shadow-sm"
                                >
                                  <Eye size={14} />
                                  Show Score
                                </Link>
                                <span className="text-xs font-semibold text-text-muted group-open:rotate-180 transition-transform">▼</span>
                              </div>
                            </div>
                          </div>
                        </summary>

                        {/* Detailed Candidate Violations Dropdown */}
                        <div className="px-6 py-5 bg-slate-50 border-t border-b space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                              <ShieldAlert size={16} />
                              Recorded Integrity Violations ({attempt.violation_events?.length || 0})
                            </h4>
                            <span className="text-xs text-text-muted">Click row to toggle dropdown view</span>
                          </div>

                          {(!attempt.violation_events || attempt.violation_events.length === 0) ? (
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              Clean Session — No integrity flags or proctoring violations were recorded for this candidate during this assessment.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {attempt.violation_events.map((ve: any, vIdx: number) => {
                                const map = VIOLATION_MAP[ve.type] || { label: ve.type, description: 'Proctoring flag logged', color: 'bg-surface-soft text-text-muted border-line' }
                                return (
                                  <div key={ve.id || vIdx} className="p-3 bg-white rounded-lg border shadow-sm flex items-start justify-between gap-4 text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-text-muted">#{vIdx + 1}</span>
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${map.color}`}>
                                          {map.label}
                                        </span>
                                      </div>
                                      <p className="text-text font-medium">{map.description}</p>
                                      {ve.meta && (
                                        <code className="block font-mono text-[10px] text-text-muted bg-surface-soft p-1.5 rounded border">
                                          {JSON.stringify(ve.meta)}
                                        </code>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-text-muted font-medium shrink-0" suppressHydrationWarning>
                                      {formatDateTime(ve.occurred_at)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
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
