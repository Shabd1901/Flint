'use client'

import { useState, useTransition } from 'react'
import { Trash2, Search, RefreshCw, X, Shield, User } from 'lucide-react'
import { deleteUserAction } from './actions'
import { ConfirmModal } from '@/components/ConfirmModal'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
}

export function UserManagementList({ users }: { users: UserProfile[] }) {
  const [search, setSearch] = useState('')
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const confirmDelete = () => {
    if (!userToDelete) return
    const userId = userToDelete.id
    startTransition(async () => {
      const res = await deleteUserAction(userId)
      setUserToDelete(null)
      if (res.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setFeedback({ type: 'success', msg: res.success || 'User deleted successfully.' })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-text">Global User Management</h2>
          <p className="text-xs text-text-muted">Maintainer control to inspect or delete any user account across the platform.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex justify-between items-center ${
            feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="divide-y divide-line border rounded-xl bg-white overflow-hidden shadow-sm">
        {filteredUsers.map((u) => (
          <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-surface-soft/40 transition">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${
                  u.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : u.role === 'maintainer'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {u.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
              </div>
              <div>
                <div className="font-semibold text-text text-sm flex items-center gap-2">
                  {u.name || u.email || 'User'}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'maintainer'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">{u.email}</div>
              </div>
            </div>

            {u.role !== 'maintainer' && (
              <button
                onClick={() => setUserToDelete(u)}
                disabled={isPending && userToDelete?.id === u.id}
                className="p-2 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition disabled:opacity-50"
                title="Delete user account"
              >
                {isPending && userToDelete?.id === u.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            )}
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-xs text-text-muted">No users found.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!userToDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${userToDelete?.name || userToDelete?.email}"? This action cannot be undone and will delete all their account data.`}
        confirmText="Permanently Delete"
        confirmVariant="danger"
        icon="trash"
        isLoading={isPending}
        onConfirm={confirmDelete}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  )
}
