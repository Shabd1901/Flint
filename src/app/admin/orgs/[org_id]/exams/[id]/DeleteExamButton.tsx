'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteExamFromDetail } from './actions'

export function DeleteExamButton({ examId, orgId }: { examId: string, orgId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this exam? This cannot be undone.')) return
    startTransition(async () => {
      const res = await deleteExamFromDetail(examId, orgId)
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
