'use client'

export function QuestionForm({
  question,
  index,
  attemptId,
  savedSelection,
  saveAnswer,
}: {
  question: { id: string; text: string; type: string; options: any }
  index: number
  attemptId: string
  savedSelection: string[]
  saveAnswer: (formData: FormData) => Promise<void>
}) {
  const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options

  return (
    <div className="surface-card p-5 space-y-4">
      <h3 className="text-lg font-medium">
        <span className="text-text-muted mr-2">{index + 1}.</span>
        {question.text}
      </h3>

      <form action={saveAnswer} className="space-y-3">
        <input type="hidden" name="question_id" value={question.id} />
        <input type="hidden" name="attempt_id" value={attemptId} />
        
        {opts?.map((opt: string, idx: number) => (
          <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:border-accent/40 transition-colors">
            <input 
              type={question.type === 'single' ? 'radio' : 'checkbox'} 
              name={question.type === 'single' ? 'option' : 'options'}
              value={opt}
              defaultChecked={savedSelection.includes(opt)}
              className="w-4 h-4 text-accent border-line focus:ring-accent"
              onChange={(e) => {
                 e.target.form?.requestSubmit()
              }}
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </form>
    </div>
  )
}
