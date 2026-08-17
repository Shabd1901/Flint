import { evaluateAnswer } from './grade'

export interface QuestionMetrics {
  questionId: string
  difficultyIndex: number // 0 to 1
  discriminationIndex: number // -1 to 1
  distractorAnalysis: Record<string, number> // option text -> percentage (0-1)
  totalAttempts: number
  warnings: string[]
}

export interface PsychometricsReport {
  overallHealth: {
    excellent: number
    good: number
    needsReview: number
    poor: number
  }
  questions: QuestionMetrics[]
  insufficientData: boolean
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

export function calculateItemAnalysis(
  questions: any[],
  attempts: any[], // with calculated total score
  answers: any[]
): PsychometricsReport {
  const report: PsychometricsReport = {
    overallHealth: { excellent: 0, good: 0, needsReview: 0, poor: 0 },
    questions: [],
    insufficientData: false
  }

  // Need at least 4 attempts to meaningfully split into top/bottom 27% (1 person each)
  // But ideally > 10. We'll set a hard floor of 4.
  if (attempts.length < 4) {
    report.insufficientData = true
    return report
  }

  // 1. Sort attempts by score descending
  const sortedAttempts = [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0))
  
  // 2. Identify top 27% and bottom 27% (Kelley's 27% Rule)
  // We use Math.ceil so if N=4, 27% is 1.08 -> 2. But let's use Math.max(1, Math.round(N * 0.27))
  const groupSize = Math.max(1, Math.round(sortedAttempts.length * 0.27))
  const topAttempts = sortedAttempts.slice(0, groupSize)
  const bottomAttempts = sortedAttempts.slice(-groupSize)

  const topAttemptIds = new Set(topAttempts.map(a => a.id))
  const bottomAttemptIds = new Set(bottomAttempts.map(a => a.id))

  // Build answer lookup Map: questionId -> attemptId -> answer
  const answerLookup = new Map<string, Map<string, any>>()
  for (const ans of answers) {
    if (!answerLookup.has(ans.question_id)) {
      answerLookup.set(ans.question_id, new Map())
    }
    answerLookup.get(ans.question_id)!.set(ans.attempt_id, ans)
  }

  // 3. Process each question
  for (const q of questions) {
    const qAnswers = answerLookup.get(q.id) || new Map()
    const metrics: QuestionMetrics = {
      questionId: q.id,
      difficultyIndex: 0,
      discriminationIndex: 0,
      distractorAnalysis: {},
      totalAttempts: attempts.length,
      warnings: []
    }

    let correctCount = 0
    let topCorrect = 0
    let bottomCorrect = 0

    // Distractor counters
    const optionCounts: Record<string, number> = {}
    if (q.type === 'single' || q.type === 'multi') {
      const options = parseArray(q.options)
      options.forEach(opt => optionCounts[opt] = 0)
    } else if (q.type === 'true_false') {
      optionCounts['true'] = 0
      optionCounts['false'] = 0
    }

    // Evaluate answers
    for (const attempt of attempts) {
      const userAns = qAnswers.get(attempt.id)
      const { isCorrect } = evaluateAnswer(q, userAns)

      if (isCorrect) {
        correctCount++
        if (topAttemptIds.has(attempt.id)) topCorrect++
        if (bottomAttemptIds.has(attempt.id)) bottomCorrect++
      }

      // Track distractors
      if (q.type === 'single' || q.type === 'multi') {
        const selected = parseArray(userAns?.selected_options)
        selected.forEach(s => {
          if (optionCounts[s] !== undefined) {
            optionCounts[s]++
          }
        })
      } else if (q.type === 'true_false') {
        const selected = parseArray(userAns?.selected_options)[0]
        if (selected === 'true' || selected === 'false') {
          optionCounts[selected]++
        }
      }
    }

    // Calculate P (Difficulty) - proportion of total attempts that got it right
    metrics.difficultyIndex = attempts.length > 0 ? correctCount / attempts.length : 0

    // Calculate D (Discrimination) - (Top Correct - Bottom Correct) / Group Size
    metrics.discriminationIndex = (topCorrect - bottomCorrect) / groupSize

    // Calculate Distractor percentages
    let totalMCQResponses = 0
    for (const count of Object.values(optionCounts)) {
      totalMCQResponses += count
    }
    
    for (const [opt, count] of Object.entries(optionCounts)) {
      const pct = attempts.length > 0 ? count / attempts.length : 0
      metrics.distractorAnalysis[opt] = pct
      
      // If a distractor was never chosen, flag it (unless it's the correct answer)
      if (pct === 0) {
        const correctOptions = parseArray(q.correct_options)
        if (!correctOptions.includes(opt)) {
          metrics.warnings.push(`Poor distractor: "${opt}" was chosen by 0% of students.`)
        }
      }
    }

    // Categorize health
    const D = metrics.discriminationIndex
    if (D >= 0.40) {
      report.overallHealth.excellent++
    } else if (D >= 0.30) {
      report.overallHealth.good++
    } else if (D >= 0.20) {
      report.overallHealth.needsReview++
      metrics.warnings.push("Marginal discrimination. Consider reviewing this question.")
    } else {
      report.overallHealth.poor++
      if (D < 0) {
        metrics.warnings.push("Negative discrimination! Low-scoring students are getting this right more often than high-scoring students. Check if the answer key is wrong.")
      } else {
        metrics.warnings.push("Poor discrimination. The question does not differentiate well between students.")
      }
    }

    report.questions.push(metrics)
  }

  return report
}
