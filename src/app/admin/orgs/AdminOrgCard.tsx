'use client'

import { useState, useTransition } from 'react'
import { Building, Trash2, Key, Users, X, RefreshCw, UserPlus, Edit2, Check } from 'lucide-react'
import { deleteOrg, addCoAdminAction, removeCoAdminAction, updateOrg } from './actions'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function AdminOrgCard({ org, currentUserId }: { org: any, currentUserId: string }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(org.name)

  const [showAdmins, setShowAdmins] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success'|'error', msg: string } | null>(null)

  const isOwner = org.admin_id === currentUserId
  const coAdmins = org.org_admins || []

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', org.id)
      const res = await deleteOrg(formData)
      if (res?.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setShowDeleteModal(false)
      }
    })
  }

  const handleRename = () => {
    if (!editName.trim() || editName.trim() === org.name) {
      setIsEditingName(false)
      return
    }
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', org.id)
      formData.append('name', editName.trim())
      await updateOrg(formData)
      setIsEditingName(false)
    })
  }

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('orgId', org.id)
      formData.append('email', newAdminEmail.trim())
      
      const res = await addCoAdminAction(formData)
      if (res?.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setFeedback({ type: 'success', msg: res.success || 'Added successfully' })
        setNewAdminEmail('')
      }
    })
  }

  const handleRemoveAdmin = (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return
    
    startTransition(async () => {
      const formData = new FormData()
      formData.append('orgId', org.id)
      formData.append('adminId', adminId)
      
      const res = await removeCoAdminAction(formData)
      if (res?.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setFeedback({ type: 'success', msg: res.success || 'Removed successfully' })
      }
    })
  }

  return (
    <div className="surface-card p-5 group flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-accent flex-shrink-0" />
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input 
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename()
                    if (e.key === 'Escape') { setIsEditingName(false); setEditName(org.name) }
                  }}
                  disabled={isPending}
                  className="h-8 rounded border px-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-xs"
                />
                <button onClick={handleRename} disabled={isPending} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded">
                  {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setIsEditingName(false); setEditName(org.name) }} disabled={isPending} className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link href={`/admin/orgs/${org.id}`} className="text-lg font-semibold truncate hover:text-accent hover:underline flex items-center gap-1 group" title={org.name}>
                  {org.name} <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                {isOwner && (
                  <button onClick={() => setIsEditingName(true)} className="text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition">
                    <Edit2 size={14} />
                  </button>
                )}
                {!isOwner && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-medium">Co-Admin</span>}
              </>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
            <Key className="w-4 h-4" />
            <span>Invite Code:</span>
            <code className="bg-surface-soft px-1.5 rounded font-mono text-xs">{org.invite_code}</code>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowAdmins(!showAdmins)}
            className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md transition" 
            title="Manage Admins"
          >
            <Users className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => {
              setShowDeleteModal(true)
              setDeleteConfirmText('')
            }}
            className="p-2 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-md transition" 
            title="Delete Organization"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`text-xs p-2 rounded ${feedback.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'} flex justify-between`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}><X size={14}/></button>
        </div>
      )}

      {/* CO-ADMINS SECTION */}
      {showAdmins && (
        <div className="mt-2 border-t pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <h4 className="text-sm font-semibold text-text">Co-Admins ({coAdmins.length})</h4>
            {coAdmins.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {coAdmins.map((ca: any) => (
                  <li key={ca.admin_id} className="flex items-center justify-between text-sm bg-surface-soft p-2 rounded-md border border-line/50">
                    <div>
                      <div className="font-medium">{ca.profiles?.name}</div>
                      <div className="text-xs text-text-muted">{ca.profiles?.email}</div>
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => handleRemoveAdmin(ca.admin_id)}
                        disabled={isPending}
                        className="text-text-muted hover:text-rose-500 p-1"
                        title="Remove Admin"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted mt-2">No co-admins added yet.</p>
            )}
          </div>

          <form onSubmit={handleAddAdmin} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-muted mb-1">Add Co-Admin by Email</label>
              <input 
                type="email" 
                required
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                className="w-full h-8 rounded-md border bg-white px-2 text-sm focus:ring-2 focus:ring-accent outline-none" 
                placeholder="admin@example.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={isPending || !newAdminEmail.trim()}
              className="h-8 px-3 rounded-md bg-accent text-xs font-semibold text-white hover:bg-accent-strong transition disabled:opacity-50 flex items-center gap-1"
            >
              {isPending ? <RefreshCw size={12} className="animate-spin" /> : <UserPlus size={12} />}
              Add
            </button>
          </form>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md p-6 relative shadow-xl border-rose-200">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <Trash2 size={20} />
              Delete Organization?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Are you sure you want to permanently delete <span className="font-semibold text-text">{org.name}</span>?
            </p>
            <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <strong>Warning:</strong> This will delete all exams, candidate enrollments, and data associated with this org.
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-text-muted mb-1">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-9 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="h-9 px-4 rounded-md border text-sm font-medium text-text-muted hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || deleteConfirmText !== 'DELETE'}
                className="h-9 px-4 rounded-md bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
