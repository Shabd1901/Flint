'use client'

import { useTransition } from 'react'
import { Trash2, Copy } from 'lucide-react'
import { deleteExam, duplicateExam } from './actions'
import { toast } from 'react-hot-toast'

export function ExamCardActions({ examId, orgId }: { examId: string, orgId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this exam and all its questions?')) return
    startTransition(async () => {
      const res = await deleteExam(examId, orgId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Exam deleted successfully")
      }
    })
  }

  function handleDuplicate() {
    startTransition(async () => {
      const res = await duplicateExam(examId, orgId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Exam duplicated successfully")
      }
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
