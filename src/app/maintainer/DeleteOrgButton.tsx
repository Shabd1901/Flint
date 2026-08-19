'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteOrgAsMaintainer } from './actions'
import { ConfirmModal } from '@/components/ConfirmModal'

export function DeleteOrgButton({ id, name }: { id: string, name: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', id)
      await deleteOrgAsMaintainer(formData)
      setShowConfirm(false)
    })
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded text-xs transition font-semibold flex items-center gap-1"
      >
        <Trash2 size={12} />
        Delete
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Organization"
        message={`Are you sure you want to delete organization "${name}"? This will permanently delete the organization, exams, and candidate data.`}
        confirmText="Delete Organization"
        confirmVariant="danger"
        icon="trash"
        isLoading={isPending}
        onConfirm={handleDelete}
        onClose={() => setShowConfirm(false)}
      />
    </>
  )
}
