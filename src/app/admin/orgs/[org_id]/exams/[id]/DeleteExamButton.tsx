'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteExamFromDetail } from './actions'
import { ConfirmModal } from '@/components/ConfirmModal'

export function DeleteExamButton({ examId, orgId }: { examId: string, orgId: string }) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      await deleteExamFromDetail(examId, orgId)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
      >
        <Trash2 size={14} /> Delete Exam
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Exam"
        message="Are you sure you want to delete this exam and all associated questions? This action cannot be undone."
        confirmText="Delete Exam"
        confirmVariant="danger"
        icon="trash"
        isLoading={isPending}
        onConfirm={handleDelete}
        onClose={() => setShowConfirm(false)}
      />
    </>
  )
}
