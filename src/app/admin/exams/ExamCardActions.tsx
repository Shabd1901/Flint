'use client'

import { useTransition } from 'react'
import { Trash2, Copy } from 'lucide-react'
import { deleteExam, duplicateExam } from './actions'

export function ExamCardActions({ examId }: { examId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this exam and all its questions?')) return
    startTransition(() => {
      deleteExam(examId)
    })
  }

  function handleDuplicate() {
    startTransition(() => {
      duplicateExam(examId)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleDuplicate}
        disabled={isPending}
        title="Duplicate exam"
        className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <Copy size={14} />
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete exam"
        className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
