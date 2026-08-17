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

export interface EvaluationResult {
  isCorrect: boolean
  candDisplay: string
  correctDisplay: string
  marksEarned: number
  isManualGrade: boolean
}

export function evaluateAnswer(q: any, userAns: any): EvaluationResult {
  let isCorrect = false
  let candDisplay = ''
  let correctDisplay = ''
  let isManualGrade = false

  if (q.type === 'single' || q.type === 'multi') {
    const selected = parseArray(userAns?.selected_options)
    const correct = parseArray(q.correct_options)
    isCorrect = correct.length > 0 && correct.length === selected.length && correct.every((c: string) => selected.includes(c))
    candDisplay = selected.length > 0 ? selected.join(', ') : 'No Answer Selected'
    correctDisplay = correct.join(', ')
  } else if (q.type === 'true_false') {
    const selected = parseArray(userAns?.selected_options)[0]
    const correct = parseArray(q.correct_options)[0]
    isCorrect = !!correct && !!selected && correct === selected
    candDisplay = selected || 'No Answer'
    correctDisplay = correct || 'N/A'
  } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
    isCorrect = !!(q.correct_text && userAns?.text_answer && (q.correct_text.trim().toLowerCase() === userAns.text_answer.trim().toLowerCase()))
    candDisplay = userAns?.text_answer || 'No Answer'
    correctDisplay = q.correct_text || 'N/A'
  } else if (q.type === 'numerical') {
    if (q.correct_number !== null && userAns?.number_answer !== null && userAns?.number_answer !== undefined) {
      const diff = Math.abs(q.correct_number - userAns.number_answer)
      isCorrect = diff <= (q.tolerance || 0)
    }
    candDisplay = userAns?.number_answer?.toString() || 'No Answer'
    correctDisplay = `${q.correct_number ?? 'N/A'} ± ${q.tolerance ?? 0}`
  } else if (q.type === 'long_answer') {
    isCorrect = false
    isManualGrade = true
    candDisplay = userAns?.text_answer || 'No Answer'
    correctDisplay = userAns?.marks_awarded !== undefined && userAns?.marks_awarded !== null ? `Graded: ${userAns.marks_awarded} pts` : 'Manual Grade Required'
  } else if (q.type === 'file_upload') {
    isCorrect = false
    isManualGrade = true
    candDisplay = userAns?.file_url ? 'File Uploaded' : 'No File'
    correctDisplay = userAns?.marks_awarded !== undefined && userAns?.marks_awarded !== null ? `Graded: ${userAns.marks_awarded} pts` : 'Manual Grade Required'
  }

  // Calculate marks earned
  let marksEarned = 0
  if (isManualGrade) {
    marksEarned = userAns?.marks_awarded ? Number(userAns.marks_awarded) : 0
  } else if (isCorrect) {
    marksEarned = Number(q.marks) || 0
  }

  return {
    isCorrect,
    candDisplay,
    correctDisplay,
    marksEarned,
    isManualGrade
  }
}
