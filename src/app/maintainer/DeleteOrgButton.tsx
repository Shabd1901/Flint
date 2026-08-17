'use client'

import { useState } from 'react'
import { Trash2, X, RefreshCw } from 'lucide-react'
import { deleteOrgAsMaintainer } from './actions'

export function DeleteOrgButton({ id, name }: { id: string, name: string }) {
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    const formData = new FormData()
    formData.append('id', id)
    await deleteOrgAsMaintainer(formData)
    setIsPending(false)
    setShowModal(false)
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => {
          setShowModal(true)
          setConfirmText('')
        }}
        className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs transition font-medium"
      >
        Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-left">
          <div className="surface-card w-full max-w-md p-6 relative shadow-xl border-rose-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <Trash2 size={20} />
              Delete Organization?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Are you sure you want to delete <span className="font-semibold text-text">{name}</span>?
            </p>
            <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <strong>Warning:</strong> This will permanently delete the organization and all its data.
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-text-muted mb-1">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-9 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-9 px-4 rounded-md border text-sm font-medium text-text-muted hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || confirmText !== 'DELETE'}
                className="h-9 px-4 rounded-md bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
