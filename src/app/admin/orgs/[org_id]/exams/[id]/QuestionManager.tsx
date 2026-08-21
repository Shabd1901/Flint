'use client'

import { useState, useTransition } from 'react'
import { Trash2, Pencil, X, Check, Plus } from 'lucide-react'
import { addQuestion, updateQuestion, deleteQuestion } from './actions'
import { ConfirmModal } from '@/components/ConfirmModal'

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
  single: 'Single Choice (SCQ)',
  multi: 'Multiple Choice (MCQ)',
  true_false: 'True / False',
  short_answer: 'Short Answer (Text)',
  long_answer: 'Long Answer (Essay)',
  fill_blank: 'Fill in the Blanks',
  numerical: 'Numerical',
  file_upload: 'File Upload'
}

const TYPE_HINTS: Record<string, string> = {
  single: 'Candidate picks one answer from the options.',
  multi: 'Candidate can pick multiple answers.',
  true_false: 'Candidate picks True or False. Auto-graded.',
  short_answer: 'Candidate types a short text answer. Auto-graded by exact match.',
  long_answer: 'Candidate writes a longer response. You grade this manually.',
  fill_blank: 'Candidate fills in the missing word. Auto-graded by exact match.',
  numerical: 'Candidate enters a number. Auto-graded with tolerance.',
  file_upload: 'Candidate uploads a file (PDF, image, etc.). You grade this manually.'
}

function QuestionFormFields({ defaultValues }: { defaultValues?: Question }) {
  const [type, setType] = useState(defaultValues?.type || 'single')
  const hint = TYPE_HINTS[type]

  const initialOptions = parseArray(defaultValues?.options)
  const initialCorrect = parseArray(defaultValues?.correct_options)
  
  const [options, setOptions] = useState(() => {
    if (defaultValues?.type === 'true_false') {
      return [
        { id: Math.random().toString(), text: 'True', isCorrect: initialCorrect.includes('True') },
        { id: Math.random().toString(), text: 'False', isCorrect: initialCorrect.includes('False') || !initialCorrect.includes('True') }
      ]
    }
    if (initialOptions.length > 0) {
      return initialOptions.map(opt => ({
        id: Math.random().toString(),
        text: opt,
        isCorrect: initialCorrect.includes(opt)
      }))
    }
    return [
      { id: Math.random().toString(), text: '', isCorrect: false },
      { id: Math.random().toString(), text: '', isCorrect: false }
    ]
  })

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Type</label>
          <select
            name="type"
            value={type}
            onChange={e => {
              const newType = e.target.value;
              setType(newType);
              if (newType === 'true_false') {
                setOptions([
                  { id: Math.random().toString(), text: 'True', isCorrect: true },
                  { id: Math.random().toString(), text: 'False', isCorrect: false }
                ])
              } else if (type === 'true_false' && newType !== 'true_false') {
                setOptions([
                  { id: Math.random().toString(), text: '', isCorrect: false },
                  { id: Math.random().toString(), text: '', isCorrect: false }
                ])
              } else if (newType === 'single' && type === 'multi') {
                let found = false;
                setOptions(options.map(o => {
                  if (o.isCorrect && !found) {
                    found = true;
                    return o;
                  }
                  return { ...o, isCorrect: false };
                }));
              }
            }}
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

      {/* Candidate Experience Hint */}
      {hint && (
        <p className="text-xs text-text-muted italic px-1">{hint}</p>
      )}

      {(type === 'single' || type === 'multi' || type === 'true_false') && (
        <div className="space-y-3 bg-surface-soft p-4 rounded-xl border border-line">
          <label className="block text-sm font-medium text-text-muted">
            {type === 'true_false' ? 'True / False Options' : 'Options'}
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input 
                  type="text"
                  value={opt.text}
                  onChange={e => setOptions(options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                  className="flex-1 h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  placeholder={`Option ${i + 1}`}
                  required
                  disabled={type === 'true_false'}
                />
                <label className="flex items-center gap-1.5 px-3 h-10 rounded-md border bg-white cursor-pointer hover:bg-surface transition shadow-sm">
                  <input 
                    type={type === 'multi' ? 'checkbox' : 'radio'}
                    name={defaultValues?.id ? `correct_${type}_${defaultValues.id}` : `correct_${type}_new`}
                    checked={opt.isCorrect}
                    onChange={(e) => {
                      if (type === 'single' || type === 'true_false') {
                        setOptions(options.map(o => ({ ...o, isCorrect: o.id === opt.id })))
                      } else {
                        setOptions(options.map(o => o.id === opt.id ? { ...o, isCorrect: e.target.checked } : o))
                      }
                    }}
                    className="accent-accent w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-text-muted">Correct</span>
                </label>
                {type !== 'true_false' && options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions(options.filter(o => o.id !== opt.id))}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition border border-transparent hover:border-rose-200 bg-white shadow-sm"
                    title="Remove Option"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {type !== 'true_false' && (
            <button
              type="button"
              onClick={() => setOptions([...options, { id: Math.random().toString(), text: '', isCorrect: false }])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-strong transition mt-2 bg-white px-3 py-1.5 rounded-lg border border-line shadow-sm hover:border-accent/40"
            >
              <Plus size={14} /> Add Option
            </button>
          )}

          <input type="hidden" name="options" value={options.map(o => o.text).join('|||')} />
          <input type="hidden" name="correct_options" value={options.filter(o => o.isCorrect).map(o => o.text).join('|||')} />
        </div>
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
        <FileTypePicker defaults={parseArray(defaultValues?.file_types)} />
      )}
    </>
  )
}

const FILE_TYPE_OPTIONS = [
  { value: '.pdf', label: 'PDF' },
  { value: '.doc', label: 'DOC' },
  { value: '.docx', label: 'DOCX' },
  { value: '.txt', label: 'TXT' },
  { value: '.jpg', label: 'JPG' },
  { value: '.jpeg', label: 'JPEG' },
  { value: '.png', label: 'PNG' },
  { value: '.gif', label: 'GIF' },
  { value: '.zip', label: 'ZIP' },
  { value: '.csv', label: 'CSV' },
  { value: '.xlsx', label: 'XLSX' },
  { value: '.pptx', label: 'PPTX' },
  { value: '.mp4', label: 'MP4' },
  { value: '.py', label: 'PY' },
  { value: '.js', label: 'JS' },
  { value: '.cpp', label: 'C++' },
]

function FileTypePicker({ defaults }: { defaults: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaults.length > 0 ? defaults : [])
  const [open, setOpen] = useState(false)
  const allValues = FILE_TYPE_OPTIONS.map(o => o.value)
  const allSelected = allValues.every(v => selected.includes(v))

  function toggle(val: string) {
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  function toggleAll() {
    setSelected(allSelected ? [] : [...allValues])
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-muted mb-1">Allowed File Types</label>
      <input type="hidden" name="file_types" value={selected.join(', ')} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 rounded-md border bg-white px-3 text-left text-sm outline-none ring-accent focus:ring-2 flex items-center justify-between"
      >
        <span className={selected.length > 0 ? 'text-text' : 'text-text-muted'}>
          {selected.length === 0 ? 'All types allowed' : allSelected ? 'All types selected' : `${selected.length} type${selected.length > 1 ? 's' : ''} selected`}
        </span>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {/* Select All */}
          <label className="flex items-center gap-2.5 px-3 py-2 border-b cursor-pointer hover:bg-surface-soft transition">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-accent w-3.5 h-3.5"
            />
            <span className="text-sm font-medium">Select All</span>
          </label>

          {FILE_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-surface-soft transition">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="accent-accent w-3.5 h-3.5"
              />
              <span className="text-sm">{opt.label}</span>
              <span className="text-xs text-text-muted ml-auto">{opt.value}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function QuestionManager({ questions, examId, orgId }: { questions: Question[], examId: string, orgId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)

  function confirmDelete() {
    if (!questionToDelete) return
    const targetId = questionToDelete
    startTransition(async () => {
      await deleteQuestion(targetId, examId, orgId)
      setQuestionToDelete(null)
    })
  }

  function handleUpdate(questionId: string, formData: FormData) {
    startTransition(async () => {
      await updateQuestion(questionId, examId, orgId, formData)
      setEditingId(null)
    })
  }

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addQuestion(examId, orgId, formData)
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

                  {(q.type === 'single' || q.type === 'multi' || q.type === 'true_false') && (
                    <ul className="space-y-1">
                      {(q.type === 'true_false' ? ['True', 'False'] : opts).map((opt, idx) => (
                        <li key={idx} className={`px-3 py-2 rounded-lg text-sm ${correct.includes(opt) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center justify-between' : 'bg-surface-soft text-text-muted'}`}>
                          <span>{opt}</span>
                          {correct.includes(opt) && <span className="text-xs font-bold uppercase text-emerald-700">Correct Answer</span>}
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
                    onClick={() => setQuestionToDelete(q.id)}
                    disabled={isPending && questionToDelete === q.id}
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

      <ConfirmModal
        isOpen={!!questionToDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete Question"
        confirmVariant="danger"
        icon="trash"
        isLoading={isPending}
        onConfirm={confirmDelete}
        onClose={() => setQuestionToDelete(null)}
      />
    </div>
  )
}
