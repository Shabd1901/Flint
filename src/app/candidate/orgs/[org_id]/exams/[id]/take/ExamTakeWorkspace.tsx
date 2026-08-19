'use client'

import { useState, useTransition } from 'react'
import { ProctoringWrapper } from './ProctoringWrapper'
import { ExamTimer } from './ExamTimer'
import { QuestionForm } from './QuestionForm'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ExamTakeWorkspace({
  attempt,
  durationMinutes,
  questions,
  answersMap,
  submitExam,
  saveAnswer,
  logViolation,
  heartbeatSession,
}: {
  attempt: any
  durationMinutes: number
  questions: any[]
  answersMap: Map<string, any>
  submitExam: () => Promise<void>
  saveAnswer: (formData: FormData) => Promise<void>
  logViolation: (attemptId: string, type: string, meta?: any) => Promise<void>
  heartbeatSession: (attemptId: string, token: string) => Promise<{ valid: boolean }>
}) {
  const [warningCount, setWarningCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFinishAndSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    // Exit fullscreen mode automatically upon completion
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore fullscreen exit errors
      }
    }

    startTransition(async () => {
      await submitExam()
    })
  }

  return (
    <div className="container-page py-6 md:py-8 max-w-4xl space-y-6 relative">
      <ProctoringWrapper
        attemptId={attempt.id}
        logAction={logViolation}
        heartbeatAction={heartbeatSession}
        onWarningCountChange={(count) => setWarningCount(count)}
      />

      <div className="flex flex-wrap justify-between items-center surface-card p-5 sticky top-4 z-10 shadow-lg gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Exam In Progress</h1>
          <p className="text-xs text-text-muted">Answers are auto-saved</p>
        </div>

        <div className="flex items-center gap-3">
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold animate-pulse">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>{warningCount} Warning{warningCount !== 1 ? 's' : ''} Logged</span>
            </div>
          )}

          <ExamTimer startedAt={attempt.started_at} durationMinutes={durationMinutes} onExpire={handleFinishAndSubmit} />
          
          <button
            onClick={handleFinishAndSubmit}
            disabled={isSubmitting || isPending}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition disabled:opacity-50"
          >
            {(isSubmitting || isPending) ? <><RefreshCw size={14} className="animate-spin" /> Submitting...</> : 'Finish & Submit'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions?.map((q: any, i: number) => {
          const existingAns = answersMap.get(q.id)
          let savedSelection: string[] = []

          if (existingAns?.selected_options) {
            const raw = existingAns.selected_options
            if (Array.isArray(raw)) {
              savedSelection = raw
            } else if (typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw)
                savedSelection = Array.isArray(parsed) ? parsed : [parsed]
              } catch {
                savedSelection = [raw]
              }
            }
          }

          return (
            <QuestionForm
              key={q.id}
              question={q}
              index={i}
              attemptId={attempt.id}
              savedSelection={savedSelection}
              savedAnswer={existingAns}
              saveAnswer={saveAnswer}
            />
          )
        })}
      </div>
    </div>
  )
}
