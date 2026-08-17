'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Search, Shield } from 'lucide-react'

interface SimilarPair {
  candidateA: { id: string; name: string; email: string }
  candidateB: { id: string; name: string; email: string }
  problemTitle: string
  similarity: number
  codeA: string
  codeB: string
}

export function PlagiarismPanel({ contestId }: { contestId: string }) {
  const [results, setResults] = useState<SimilarPair[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [threshold, setThreshold] = useState(80)

  async function runCheck() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/contests/${contestId}/plagiarism?threshold=${threshold}`)
      const data = await res.json()
      setResults(data.pairs || [])
    })
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="p-5 border-b bg-surface-soft/30 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Shield size={18} className="text-rose-500" />
            Code Similarity / Plagiarism Check
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Compares all submissions per problem and flags pairs above the threshold.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted font-medium">Threshold:</label>
            <select
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="h-8 rounded-md border bg-white px-2 text-sm outline-none"
            >
              <option value={60}>60%</option>
              <option value={70}>70%</option>
              <option value={80}>80%</option>
              <option value={90}>90%</option>
            </select>
          </div>

          <button
            onClick={runCheck}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
          >
            <Search size={14} />
            {isPending ? 'Scanning...' : 'Run Plagiarism Check'}
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="p-5">
          {results.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No suspicious pairs found above {threshold}% similarity.</p>
              <p className="text-xs mt-1">All clear — submissions appear to be original.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-text-muted mb-3">
                <AlertTriangle size={14} className="inline mr-1 text-amber-500" />
                Found <span className="font-semibold text-text">{results.length}</span> suspicious pair{results.length !== 1 ? 's' : ''} above {threshold}% similarity.
              </p>

              {results.map((pair, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-soft/50 transition text-sm"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-medium">{pair.candidateA.name}</span>
                      <span className="text-text-muted">vs</span>
                      <span className="font-medium">{pair.candidateB.name}</span>
                      <span className="text-xs bg-surface-soft px-2 py-0.5 rounded text-text-muted">{pair.problemTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono font-bold text-sm px-2.5 py-1 rounded ${
                        pair.similarity >= 90 ? 'bg-rose-100 text-rose-700' :
                        pair.similarity >= 80 ? 'bg-amber-100 text-amber-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pair.similarity}%
                      </span>
                      {expandedIdx === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expandedIdx === idx && (
                    <div className="border-t px-4 py-4 bg-slate-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-text-muted mb-2">
                            {pair.candidateA.name} <span className="font-normal">({pair.candidateA.email})</span>
                          </p>
                          <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto max-h-72 whitespace-pre-wrap font-mono leading-relaxed">
                            {pair.codeA}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-muted mb-2">
                            {pair.candidateB.name} <span className="font-normal">({pair.candidateB.email})</span>
                          </p>
                          <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto max-h-72 whitespace-pre-wrap font-mono leading-relaxed">
                            {pair.codeB}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
