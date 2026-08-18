'use client'

import { useState } from 'react'
import { Play, Send, CheckCircle2, XCircle, Code2, BookOpen, Trophy, Clock, History, AlertCircle } from 'lucide-react'
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
  const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'leaderboard'>('problem')
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)

  const handleLanguageChange = (newLang: 'python' | 'javascript') => {
    setLanguage(newLang)
    setCode(newLang === 'python' ? starterPy : starterJs)
    setResults(null)
  }

  const handleRunSample = async () => {
    setIsExecuting(true)
    setSubmitSummary(null)
    setIsConsoleOpen(true)
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
    setIsConsoleOpen(true)
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
    <div className="flex h-full w-full">
      {/* LEFT PANE - Problem & Tabs (Fixed Width, e.g. 40%) */}
      <div className="w-[45%] flex flex-col border-r bg-white h-full overflow-hidden">
        
        {/* Left Pane Tabs */}
        <div className="flex items-center gap-6 px-4 border-b h-12 flex-none bg-slate-50">
          <button 
            onClick={() => setActiveLeftTab('problem')}
            className={`h-full flex items-center gap-2 text-xs font-semibold border-b-2 transition-colors ${activeLeftTab === 'problem' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'}`}
          >
            <BookOpen size={14} /> Description
          </button>
          <button 
            onClick={() => setActiveLeftTab('leaderboard')}
            className={`h-full flex items-center gap-2 text-xs font-semibold border-b-2 transition-colors ${activeLeftTab === 'leaderboard' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'}`}
          >
            <Trophy size={14} /> Leaderboard
          </button>
        </div>

        {/* Left Pane Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeLeftTab === 'problem' && (
            <div className="space-y-6">
              {/* Problem Selection Navigation (replaces tabs) */}
              <div className="flex items-center justify-between border-b pb-4">
                <select 
                  className="bg-transparent text-lg font-semibold tracking-tight outline-none cursor-pointer text-text hover:text-accent transition-colors"
                  value={selectedProblemIndex}
                  onChange={(e) => {
                    setSelectedProblemIndex(Number(e.target.value))
                    setResults(null)
                    setSubmitSummary(null)
                    setIsConsoleOpen(false)
                  }}
                >
                  {problems.map((p, idx) => (
                    <option key={p.id} value={idx}>{idx + 1}. {p.title}</option>
                  ))}
                </select>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-surface-soft text-text-muted">
                  Problem {selectedProblemIndex + 1} of {problems.length}
                </div>
              </div>

              <div className="prose prose-sm prose-slate max-w-none text-text">
                <div className="whitespace-pre-wrap leading-relaxed">{currentProblem?.statement}</div>
              </div>
            </div>
          )}

          {activeLeftTab === 'leaderboard' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contest Standings</h3>
              <Leaderboard contestId={contestId} />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE - Editor & Console (Flex Grow) */}
      <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] relative">
        
        {/* Editor Header Bar */}
        <div className="h-10 flex-none bg-[#2d2d2d] border-b border-[#404040] flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-[#cccccc] text-xs font-medium">
            <Code2 size={14} />
            <span>Editor</span>
          </div>
          <div className="flex items-center">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="h-7 rounded border border-[#404040] bg-[#1e1e1e] text-[#cccccc] px-2 text-xs outline-none cursor-pointer focus:border-accent"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node)</option>
            </select>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 min-h-0 relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-transparent text-[#d4d4d4] p-4 outline-none resize-none font-mono text-[13px] leading-relaxed selection:bg-[#264f78]"
            spellCheck={false}
          />
        </div>

        {/* Console / Terminal (Bottom Toggle) */}
        <div className={`flex flex-col flex-none border-t border-[#404040] transition-all duration-300 ease-in-out bg-[#1e1e1e] ${isConsoleOpen ? 'h-64' : 'h-12'}`}>
          {/* Toolbar */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-[#404040] flex-none">
            <button 
              onClick={() => setIsConsoleOpen(!isConsoleOpen)} 
              className="text-[#cccccc] text-xs font-semibold hover:text-white transition-colors flex items-center gap-2"
            >
              Console {isConsoleOpen ? '▼' : '▲'}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunSample}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 rounded bg-[#333333] px-3 py-1.5 text-xs font-semibold text-[#cccccc] hover:bg-[#444444] disabled:opacity-50 transition-colors"
              >
                {isExecuting ? <Clock size={14} className="animate-spin" /> : <Play size={14} />} 
                Run Code
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-50 transition-colors"
              >
                {isExecuting ? <Clock size={14} className="animate-spin" /> : <Send size={14} />} 
                Submit
              </button>
            </div>
          </div>

          {/* Console Content */}
          {isConsoleOpen && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#1e1e1e] text-[#cccccc] font-mono text-[13px] space-y-4">
              {!results && !isExecuting && (
                <div className="text-[#808080] flex items-center gap-2">
                  <AlertCircle size={14} /> You must run your code first.
                </div>
              )}
              {isExecuting && (
                <div className="text-accent animate-pulse flex items-center gap-2">
                  <Clock size={14} className="animate-spin" /> Executing on remote server...
                </div>
              )}

              {submitSummary && !isExecuting && (
                <div className={`p-3 rounded border ${submitSummary.passedCount === submitSummary.totalCount ? 'bg-[#1a2d21] border-[#2e5039] text-[#7ce38b]' : 'bg-[#3b1f1f] border-[#6b3131] text-[#f48771]'}`}>
                  <strong>Submission Result: </strong>
                  {submitSummary.score} pts ({submitSummary.passedCount}/{submitSummary.totalCount} tests passed)
                </div>
              )}

              {results && !isExecuting && (
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div key={i} className="space-y-2 pb-3 border-b border-[#333333] last:border-0">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-2">
                          {r.passed ? <CheckCircle2 size={14} className="text-[#7ce38b]" /> : <XCircle size={14} className="text-[#f48771]" />}
                          Test Case {i + 1}
                        </span>
                        <span className="text-[#808080] text-[11px]">{r.time}</span>
                      </div>
                      
                      {r.stdout && (
                        <div className="space-y-1">
                          <div className="text-[#808080] text-[11px] uppercase tracking-wider">Output</div>
                          <div className="bg-[#111111] p-2 rounded text-[#cccccc] whitespace-pre-wrap">{r.stdout}</div>
                        </div>
                      )}
                      
                      {r.stderr && (
                        <div className="space-y-1 mt-2">
                          <div className="text-[#808080] text-[11px] uppercase tracking-wider">Error</div>
                          <div className="bg-[#3b1f1f] p-2 rounded text-[#f48771] whitespace-pre-wrap">{r.stderr}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
