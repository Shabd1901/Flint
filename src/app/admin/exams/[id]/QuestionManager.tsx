'use client'

import { useState, useTransition } from 'react'
import { Trash2, Pencil, X, Check, Plus } from 'lucide-react'
import { addQuestion, updateQuestion, deleteQuestion } from './actions'

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

interface Question {
  id: string
  text: string
  type: string
  options: any
  correct_options: any
  marks: number
  correct_text?: string | null
  correct_number?: number | null
  tolerance?: number | null
  max_words?: number | null
  file_types?: string[] | null
}

const TYPE_LABELS: Record<string, string> = {
  single: 'Single Choice (MCQ)',
  multi: 'Multiple Choice (MCQ)',
  true_false: 'True / False',
  short_answer: 'Short Answer (Text)',
  long_answer: 'Long Answer (Essay)',
  fill_blank: 'Fill in the Blanks',
  numerical: 'Numerical',
  file_upload: 'File Upload'
}

function QuestionFormFields({ defaultValues }: { defaultValues?: Question }) {
  const [type, setType] = useState(defaultValues?.type || 'single')

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Type</label>
          <select 
            name="type" 
            value={type} 
            onChange={e => setType(e.target.value)}
            className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm"
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Marks</label>
          <input name="marks" type="number" required defaultValue={defaultValues?.marks || 1} min="1" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
        </div>
      </div>

      {(type === 'single' || type === 'multi') && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Options (comma separated)</label>
            <input name="options" required defaultValue={parseArray(defaultValues?.options).join(', ')} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="A, B, C, D" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Correct Options (comma separated)</label>
            <input name="correct_options" required defaultValue={parseArray(defaultValues?.correct_options).join(', ')} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="A, C" />
          </div>
        </>
      )}

      {(type === 'short_answer' || type === 'fill_blank') && (
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Exact Expected Answer (for auto-grading)</label>
          <input name="correct_text" defaultValue={defaultValues?.correct_text || ''} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Mitochondria" />
        </div>
      )}

      {type === 'numerical' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Correct Number</label>
            <input name="correct_number" type="number" step="any" defaultValue={defaultValues?.correct_number ?? ''} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. 42" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Tolerance (±)</label>
            <input name="tolerance" type="number" step="any" defaultValue={defaultValues?.tolerance ?? ''} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. 0.5" />
          </div>
        </div>
      )}

      {type === 'long_answer' && (
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Word Limit (Optional)</label>
          <input name="max_words" type="number" defaultValue={defaultValues?.max_words || ''} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. 500" />
        </div>
      )}

      {type === 'file_upload' && (
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Allowed File Types (comma separated)</label>
          <input name="file_types" defaultValue={parseArray(defaultValues?.file_types).join(', ')} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder=".pdf, .docx, .zip" />
        </div>
      )}
    </>
  )
}

export function QuestionManager({ questions, examId }: { questions: Question[], examId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)

  function handleDelete(questionId: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    startTransition(() => {
      deleteQuestion(questionId, examId)
    })
  }

  function handleUpdate(questionId: string, formData: FormData) {
    startTransition(async () => {
      await updateQuestion(questionId, examId, formData)
      setEditingId(null)
    })
  }

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addQuestion(examId, formData)
      setShowAddForm(false)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-muted">Questions ({questions?.length || 0})</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong transition"
        >
          {showAddForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Question</>}
        </button>
      </div>

      {showAddForm && (
        <form action={handleAdd} className="surface-card p-5 space-y-4 border-accent/30 border-2 border-dashed">
          <h3 className="text-sm font-semibold text-accent">New Question</h3>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Question Text</label>
            <textarea name="question_text" required rows={3} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" />
          </div>

          <QuestionFormFields />

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Question'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {questions?.map((q, i) => {
          const isEditing = editingId === q.id

          if (isEditing) {
            return (
              <form key={q.id} action={(fd) => handleUpdate(q.id, fd)} className="surface-card p-5 space-y-4 ring-2 ring-accent/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-accent">Editing Question {i + 1}</span>
                  <button type="button" onClick={() => setEditingId(null)} className="text-text-muted hover:text-text transition">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Question Text</label>
                  <textarea name="question_text" required rows={3} defaultValue={q.text} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" />
                </div>

                <QuestionFormFields defaultValues={q} />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition disabled:opacity-50"
                  >
                    <Check size={14} /> {isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-soft transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )
          }

          // Display question summary
          const opts = parseArray(q.options)
          const correct = parseArray(q.correct_options)
          const fileTypes = parseArray(q.file_types)

          return (
            <div key={q.id} className="surface-card p-5 group">
              <div className="flex gap-3 items-start">
                <span className="font-bold text-text-muted">{i + 1}.</span>
                <div className="space-y-3 flex-1">
                  <p className="font-medium">{q.text}</p>
                  
                  {(q.type === 'single' || q.type === 'multi') && (
                    <ul className="space-y-1">
                      {opts.map((opt, idx) => (
                        <li key={idx} className={`px-3 py-2 rounded-lg text-sm ${correct.includes(opt) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' : 'bg-surface-soft text-text-muted'}`}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}

                  {(q.type === 'short_answer' || q.type === 'fill_blank') && (
                    <div className="text-sm bg-surface-soft px-3 py-2 rounded-lg text-text-muted">
                      Expected: <span className="font-medium text-text">{q.correct_text || '(not set)'}</span>
                    </div>
                  )}

                  {q.type === 'numerical' && (
                    <div className="text-sm bg-surface-soft px-3 py-2 rounded-lg text-text-muted">
                      Expected: <span className="font-medium text-text">{q.correct_number ?? '(not set)'}</span> ± {q.tolerance ?? 0}
                    </div>
                  )}

                  {q.type === 'file_upload' && (
                    <div className="text-sm bg-surface-soft px-3 py-2 rounded-lg text-text-muted flex gap-2">
                      Allowed Types: {fileTypes.length > 0 ? fileTypes.map(ft => (
                        <span key={ft} className="bg-white border rounded px-1.5 font-mono text-xs">{ft}</span>
                      )) : 'Any'}
                    </div>
                  )}

                  {q.type === 'long_answer' && q.max_words && (
                    <div className="text-sm text-text-muted">
                      Word Limit: {q.max_words} words
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase bg-surface-soft text-text-muted px-2 py-1 rounded-md">{TYPE_LABELS[q.type] || q.type}</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-semibold">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setEditingId(q.id)}
                    className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition opacity-0 group-hover:opacity-100"
                    title="Edit question"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {(!questions || questions.length === 0) && !showAddForm && (
          <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
            No questions yet. Click &ldquo;Add Question&rdquo; to get started.
          </div>
        )}
      </div>
    </div>
  )
}
