'use client'

import { useRef, useState, useTransition } from 'react'
import { UploadCloud, CheckCircle2, File } from 'lucide-react'

export function QuestionForm({
  question,
  index,
  attemptId,
  savedSelection,
  savedAnswer,
  saveAnswer,
}: {
  question: { id: string; text: string; type: string; options: any; max_words?: number; file_types?: string[] }
  index: number
  attemptId: string
  savedSelection: string[]
  savedAnswer?: any
  saveAnswer: (formData: FormData) => Promise<void>
}) {
  const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  
  // Local state for debounced autosave of text/number inputs
  const [textVal, setTextVal] = useState(savedAnswer?.text_answer || '')
  const [numVal, setNumVal] = useState(savedAnswer?.number_answer ?? '')
  const [fileUploaded, setFileUploaded] = useState(!!savedAnswer?.file_url)

  const handleAutoSubmit = () => {
    if (formRef.current) {
      const fd = new FormData(formRef.current)
      startTransition(() => {
        saveAnswer(fd)
      })
    }
  }

  return (
    <div className="surface-card p-5 space-y-4">
      <h3 className="text-lg font-medium">
        <span className="text-text-muted mr-2">{index + 1}.</span>
        {question.text}
      </h3>

      <form ref={formRef} action={saveAnswer} className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleAutoSubmit(); }}>
        <input type="hidden" name="question_id" value={question.id} />
        <input type="hidden" name="attempt_id" value={attemptId} />
        <input type="hidden" name="q_type" value={question.type} />
        
        {/* MCQ & True/False */}
        {(question.type === 'single' || question.type === 'multi' || question.type === 'true_false') && (
          <div className="space-y-2">
            {question.type === 'true_false' && ['True', 'False'].map((opt, idx) => (
              <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:border-accent/40 transition-colors">
                <input 
                  type="radio"
                  name="option"
                  value={opt}
                  defaultChecked={savedSelection.includes(opt)}
                  className="w-4 h-4 text-accent border-line focus:ring-accent"
                  onChange={handleAutoSubmit}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}

            {(question.type === 'single' || question.type === 'multi') && opts?.map((opt: string, idx: number) => (
              <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:border-accent/40 transition-colors">
                <input 
                  type={question.type === 'single' ? 'radio' : 'checkbox'} 
                  name={question.type === 'single' ? 'option' : 'options'}
                  value={opt}
                  defaultChecked={savedSelection.includes(opt)}
                  className="w-4 h-4 text-accent border-line focus:ring-accent"
                  onChange={handleAutoSubmit}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* Short Answer / Fill Blank */}
        {(question.type === 'short_answer' || question.type === 'fill_blank') && (
          <input 
            type="text" 
            name="text_answer"
            value={textVal}
            onChange={e => setTextVal(e.target.value)}
            onBlur={handleAutoSubmit}
            className="w-full h-11 rounded-lg border bg-white px-4 outline-none ring-accent focus:ring-2"
            placeholder="Type your answer here..."
          />
        )}

        {/* Numerical */}
        {question.type === 'numerical' && (
          <input 
            type="number" 
            step="any"
            name="number_answer"
            value={numVal}
            onChange={e => setNumVal(e.target.value)}
            onBlur={handleAutoSubmit}
            className="w-full sm:w-1/2 h-11 rounded-lg border bg-white px-4 outline-none ring-accent focus:ring-2 font-mono"
            placeholder="0.00"
          />
        )}

        {/* Long Answer */}
        {question.type === 'long_answer' && (
          <div className="space-y-1">
            <textarea 
              name="text_answer"
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              onBlur={handleAutoSubmit}
              rows={5}
              className="w-full rounded-lg border bg-white px-4 py-3 outline-none ring-accent focus:ring-2 resize-y"
              placeholder="Type your essay here..."
            />
            {question.max_words && (
              <div className="text-right text-xs text-text-muted">
                {textVal.trim().split(/\s+/).filter(Boolean).length} / {question.max_words} words
              </div>
            )}
          </div>
        )}

        {/* File Upload */}
        {question.type === 'file_upload' && (
          <div className="space-y-3">
            {fileUploaded && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <CheckCircle2 size={16} /> File successfully uploaded and saved.
                <a href={savedAnswer?.file_url} target="_blank" className="ml-2 text-xs font-semibold underline">View</a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                name="file_answer"
                accept={question.file_types ? question.file_types.join(',') : '*'}
                className="text-sm text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-soft file:text-text hover:file:bg-line cursor-pointer border rounded-lg w-full bg-white"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    setFileUploaded(false)
                    startTransition(async () => {
                      if (formRef.current) {
                        await saveAnswer(new FormData(formRef.current))
                        setFileUploaded(true)
                      }
                    })
                  }
                }}
              />
            </div>
            {question.file_types && question.file_types.length > 0 && (
              <div className="text-xs text-text-muted">
                Allowed types: {question.file_types.join(', ')}
              </div>
            )}
          </div>
        )}

        {isPending && <div className="text-xs text-text-muted animate-pulse">Saving...</div>}
      </form>
    </div>
  )
}
