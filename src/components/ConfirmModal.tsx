'use client'

import { AlertTriangle, Trash2, UserX, X } from 'lucide-react'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  confirmVariant?: 'danger' | 'warning' | 'primary'
  icon?: 'trash' | 'user-x' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  confirmVariant = 'danger',
  icon = 'trash',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-accent hover:bg-accent-strong text-white',
  }[confirmVariant]

  const IconComponent = {
    trash: Trash2,
    'user-x': UserX,
    warning: AlertTriangle,
  }[icon]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="surface-card w-full max-w-md bg-white p-6 shadow-2xl rounded-2xl border border-line space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <IconComponent size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text tracking-tight">{title}</h3>
              <p className="text-xs text-text-muted mt-0.5">{message}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-soft transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border bg-white text-xs font-semibold text-text hover:bg-surface-soft transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2 ${variantStyles}`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
