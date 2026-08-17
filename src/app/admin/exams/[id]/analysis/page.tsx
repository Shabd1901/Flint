import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Target, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { calculateItemAnalysis } from '@/utils/psychometrics'

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

export default async function ExamItemAnalysis({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).single()
  const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', id).order('created_at', { ascending: true })
  
  // Only use submitted attempts for item analysis
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', id)
    .eq('status', 'submitted')

  const attemptIds = attempts?.map(a => a.id) || []
  const { data: answers } = attemptIds.length > 0
    ? await supabase.from('exam_answers').select('*').in('attempt_id', attemptIds)
    : { data: [] }

  const report = calculateItemAnalysis(questions || [], attempts || [], answers || [])

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <Link href={`/admin/exams/${id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Exam Responses
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Item Analysis & Psychometrics</h1>
        <p className="text-text-muted mt-1">Difficulty, discrimination, and distractor analysis for {exam?.title}</p>
      </div>

      {report.insufficientData ? (
        <div className="surface-card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Insufficient Data for Analysis</h3>
          <p className="text-text-muted max-w-md mx-auto mt-2">
            Item analysis requires at least 4 submitted attempts to meaningfully calculate discrimination indexes (Top 27% vs Bottom 27%). Currently, there are {attempts?.length} submitted attempts.
          </p>
        </div>
      ) : (
        <>
          {/* Health Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="surface-card p-4 border-emerald-200">
              <div className="text-emerald-600 mb-2"><TrendingUp size={20} /></div>
              <p className="text-2xl font-bold">{report.overallHealth.excellent}</p>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Excellent</p>
              <p className="text-xs text-text-muted mt-1">D ≥ 0.40</p>
            </div>
            <div className="surface-card p-4 border-blue-200">
              <div className="text-blue-600 mb-2"><Target size={20} /></div>
              <p className="text-2xl font-bold">{report.overallHealth.good}</p>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Good</p>
              <p className="text-xs text-text-muted mt-1">0.30 ≤ D &lt; 0.40</p>
            </div>
            <div className="surface-card p-4 border-amber-200">
              <div className="text-amber-500 mb-2"><AlertTriangle size={20} /></div>
              <p className="text-2xl font-bold">{report.overallHealth.needsReview}</p>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Needs Review</p>
              <p className="text-xs text-text-muted mt-1">0.20 ≤ D &lt; 0.30</p>
            </div>
            <div className="surface-card p-4 border-rose-200">
              <div className="text-rose-500 mb-2"><HelpCircle size={20} /></div>
              <p className="text-2xl font-bold">{report.overallHealth.poor}</p>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Poor / Discard</p>
              <p className="text-xs text-text-muted mt-1">D &lt; 0.20</p>
            </div>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="p-5 border-b bg-surface-soft/30">
              <h2 className="text-base font-semibold">Question Breakdown</h2>
              <p className="text-xs text-text-muted mt-0.5">Based on {attempts?.length} submitted attempts</p>
            </div>
            
            <div className="divide-y divide-line">
              {report.questions.map((qReport, idx) => {
                const q = questions?.find((x: any) => x.id === qReport.questionId)
                if (!q) return null
                
                const pPct = Math.round(qReport.difficultyIndex * 100)
                const dVal = qReport.discriminationIndex.toFixed(2)
                
                return (
                  <div key={q.id} className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 hover:bg-surface-soft/20 transition">
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold">Q{idx + 1}. {q.text}</span>
                        <span className="text-[10px] bg-surface-soft px-1.5 py-0.5 rounded font-medium uppercase tracking-wider whitespace-nowrap ml-4">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {qReport.warnings.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-1.5 mt-2">
                          {qReport.warnings.map((w, wIdx) => (
                            <p key={wIdx} className="text-xs text-rose-800 flex items-center gap-1.5">
                              <AlertTriangle size={12} className="shrink-0" /> {w}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Distractor Analysis */}
                      {(q.type === 'single' || q.type === 'multi' || q.type === 'true_false') && (
                        <div className="mt-4 pt-4 border-t border-line/50">
                          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Distractor Analysis</p>
                          <div className="space-y-1.5">
                            {Object.entries(qReport.distractorAnalysis).map(([opt, pct]) => {
                              const isCorrect = parseArray(q.correct_options).includes(opt)
                              const optPct = Math.round(pct * 100)
                              return (
                                <div key={opt} className={`flex items-center text-xs p-1.5 rounded ${isCorrect ? 'bg-emerald-50 border border-emerald-100 font-medium text-emerald-900' : 'text-text-muted'}`}>
                                  <div className="w-12 text-right mr-3 font-mono shrink-0">{optPct}%</div>
                                  <div className="w-full h-1.5 bg-surface-soft rounded-full overflow-hidden mr-3">
                                    <div className={`h-full ${isCorrect ? 'bg-emerald-500' : optPct === 0 ? 'bg-rose-300' : 'bg-slate-300'}`} style={{ width: `${optPct}%` }} />
                                  </div>
                                  <div className="truncate w-full">{opt}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 lg:border-l lg:pl-6">
                      <div>
                        <div className="flex items-end justify-between mb-1">
                          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Difficulty (P)</span>
                          <span className="font-mono text-sm font-semibold">{pPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-soft rounded-full overflow-hidden">
                          <div className={`h-full ${pPct > 75 ? 'bg-blue-400' : pPct < 25 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${pPct}%` }} />
                        </div>
                        <p className="text-[10px] text-text-muted mt-1 text-right">
                          {pPct > 75 ? 'Easy' : pPct < 25 ? 'Hard' : 'Moderate'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-end justify-between mb-1">
                          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Discrimination (D)</span>
                          <span className={`font-mono text-sm font-semibold ${qReport.discriminationIndex < 0.2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {dVal}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-soft rounded-full overflow-hidden flex">
                          <div className="w-1/2 flex justify-end">
                            <div className="h-full bg-rose-400" style={{ width: `${Math.max(0, -qReport.discriminationIndex * 100)}%` }} />
                          </div>
                          <div className="w-1/2">
                            <div className="h-full bg-emerald-400" style={{ width: `${Math.max(0, qReport.discriminationIndex * 100)}%` }} />
                          </div>
                        </div>
                        <p className="text-[10px] text-text-muted mt-1 text-right">
                          Range: -1.0 to 1.0
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
