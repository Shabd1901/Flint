'use client'

import { useState } from 'react'
import { Play, Send, CheckCircle2, XCircle } from 'lucide-react'
import { runSampleCode, submitFullSolution } from './actions'
import { Leaderboard } from '@/components/Leaderboard'

export function CodeWorkspace({
  contestId,
  attemptId,
  problems,
}: {
  contestId: string
  attemptId: string
  problems: any[]
}) {
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0)
  const [language, setLanguage] = useState<'python' | 'javascript'>('python')
  
  const currentProblem = problems[selectedProblemIndex] || problems[0]
  const starterPy = currentProblem?.starter_code?.python || 'def solution(input_str):\n    return input_str'
  const starterJs = currentProblem?.starter_code?.javascript || 'function solution(inputStr) {\n    return inputStr;\n}'

  const [code, setCode] = useState(language === 'python' ? starterPy : starterJs)
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [submitSummary, setSubmitSummary] = useState<{ score: number; passedCount: number; totalCount: number } | null>(null)

  const handleLanguageChange = (newLang: 'python' | 'javascript') => {
    setLanguage(newLang)
    setCode(newLang === 'python' ? starterPy : starterJs)
    setResults(null)
  }

  const handleRunSample = async () => {
    setIsExecuting(true)
    setSubmitSummary(null)
    try {
      const res = await runSampleCode(currentProblem.id, language, code)
      setResults(res.results)
    } catch {
      // error handled
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSubmitSolution = async () => {
    setIsExecuting(true)
    try {
      const res = await submitFullSolution(contestId, attemptId, currentProblem.id, language, code)
      setResults(res.results)
      setSubmitSummary({ score: res.score, passedCount: res.passedCount, totalCount: res.totalCount })
    } catch {
      // error handled
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Problem View Column */}
      <div className="lg:col-span-5 space-y-4">
        {/* Problem selector tabs */}
        <div className="flex gap-2 border-b pb-2">
          {problems.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProblemIndex(idx)
                setResults(null)
                setSubmitSummary(null)
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                idx === selectedProblemIndex
                  ? 'bg-accent text-white'
                  : 'bg-surface-soft text-text-muted hover:bg-line'
              }`}
            >
              P{idx + 1}: {p.title}
            </button>
          ))}
        </div>

        <div className="surface-card p-5 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{currentProblem?.title}</h2>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{currentProblem?.statement}</p>
        </div>

        {/* Realtime Contest Leaderboard */}
        <Leaderboard contestId={contestId} />
      </div>

      {/* Code Editor & Output Column */}
      <div className="lg:col-span-7 space-y-4">
        <div className="surface-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-text-muted">Language:</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as any)}
                className="h-8 rounded border bg-white px-2 text-xs font-mono outline-none ring-accent focus:ring-1"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRunSample}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 rounded bg-surface-soft px-3 py-1.5 text-xs font-medium text-text hover:bg-line disabled:opacity-50"
              >
                <Play size={14} /> Run Sample Cases
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
              >
                <Send size={14} /> Submit Solution
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="relative border rounded-lg overflow-hidden bg-slate-950 font-mono text-sm">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              className="w-full bg-slate-950 text-slate-100 p-4 outline-none resize-none font-mono text-sm leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Execution Output Panel */}
        {results && (
          <div className="surface-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold">Execution Results</h3>
              {submitSummary && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Score: {submitSummary.score} pts ({submitSummary.passedCount}/{submitSummary.totalCount} passed)
                </span>
              )}
            </div>

            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`p-3 rounded-md text-xs font-mono border ${r.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {r.passed ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-rose-600" />}
                      Test Case #{i + 1}: {r.status}
                    </span>
                    <span className="text-text-muted">{r.time}</span>
                  </div>

                  {r.stdout && (
                    <div className="mt-2 text-text">
                      <span className="text-text-muted block">Output:</span>
                      <pre className="mt-0.5 whitespace-pre-wrap">{r.stdout}</pre>
                    </div>
                  )}

                  {r.stderr && (
                    <div className="mt-2 text-rose-700">
                      <span className="block font-semibold">Error:</span>
                      <pre className="mt-0.5 whitespace-pre-wrap">{r.stderr}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
