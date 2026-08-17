/**
 * Code similarity utilities for plagiarism detection.
 * Uses normalized Levenshtein distance for pairwise comparison.
 */

/** Strip comments, collapse whitespace, lowercase for fairer comparison. */
export function normalizeCode(source: string, language: string): string {
  let code = source

  // Remove single-line comments
  if (language === 'python') {
    code = code.replace(/#.*/g, '')
  } else {
    // JS, C++, Java, etc.
    code = code.replace(/\/\/.*/g, '')
  }

  // Remove multi-line comments (/* ... */)
  code = code.replace(/\/\*[\s\S]*?\*\//g, '')

  // Remove string literals to avoid false positives on identical prompts
  code = code.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '""')

  // Collapse all whitespace (newlines, tabs, spaces) into single space
  code = code.replace(/\s+/g, ' ').trim()

  // Lowercase
  code = code.toLowerCase()

  return code
}

/** Levenshtein distance between two strings. */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Use two-row optimization to save memory
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j] + 1,           // deletion
        prev[j - 1] + cost     // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[b.length]
}

/** Returns similarity ratio between 0 and 1 (1 = identical). */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLen
}

export interface Submission {
  candidateId: string
  candidateName: string
  candidateEmail: string
  sourceCode: string
  language: string
  problemId: string
  problemTitle: string
}

export interface SimilarPair {
  candidateA: { id: string; name: string; email: string }
  candidateB: { id: string; name: string; email: string }
  problemTitle: string
  similarity: number // 0-100
  codeA: string
  codeB: string
}

/** Compare all submissions for the same problem, return pairs above threshold. */
export function findSimilarPairs(
  submissions: Submission[],
  threshold: number = 80
): SimilarPair[] {
  // Group by problem
  const byProblem = new Map<string, Submission[]>()
  for (const sub of submissions) {
    const existing = byProblem.get(sub.problemId) || []
    existing.push(sub)
    byProblem.set(sub.problemId, existing)
  }

  const pairs: SimilarPair[] = []

  for (const [, subs] of byProblem) {
    if (subs.length < 2) continue

    // Normalize all code upfront
    const normalized = subs.map(s => ({
      ...s,
      normalized: normalizeCode(s.sourceCode, s.language)
    }))

    // Pairwise comparison
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const a = normalized[i]
        const b = normalized[j]

        // Skip if same candidate
        if (a.candidateId === b.candidateId) continue

        const sim = levenshteinSimilarity(a.normalized, b.normalized)
        const simPct = Math.round(sim * 100)

        if (simPct >= threshold) {
          pairs.push({
            candidateA: { id: a.candidateId, name: a.candidateName, email: a.candidateEmail },
            candidateB: { id: b.candidateId, name: b.candidateName, email: b.candidateEmail },
            problemTitle: a.problemTitle,
            similarity: simPct,
            codeA: a.sourceCode,
            codeB: b.sourceCode
          })
        }
      }
    }
  }

  // Sort by similarity descending
  pairs.sort((a, b) => b.similarity - a.similarity)

  return pairs
}
