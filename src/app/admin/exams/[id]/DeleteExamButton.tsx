'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteExamFromDetail } from './actions'

export function DeleteExamButton({ examId }: { examId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Permanently delete this exam and all its questions, attempts, and answers?')) return
    startTransition(() => {
      deleteExamFromDetail(examId)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
    >
      <Trash2 size={14} /> {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
