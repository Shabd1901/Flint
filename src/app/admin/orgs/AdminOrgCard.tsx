'use client'

import { useState, useTransition } from 'react'
import { Trash2, Key, Users, X, RefreshCw, UserPlus, Edit2, Check, MoreVertical, Copy, GraduationCap } from 'lucide-react'
import { deleteOrg, addCoAdminAction, removeCoAdminAction, updateOrg } from './actions'
import Link from 'next/link'

export function AdminOrgCard({ org, currentUserId }: { org: any, currentUserId: string }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(org.name)

  const [showAdmins, setShowAdmins] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success'|'error', msg: string } | null>(null)
  const [copied, setCopied] = useState(false)

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(org.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="rounded-xl border border-line overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col bg-white">
        {/* Professional Header — clickable to enter classroom */}
        <Link
          href={`/admin/orgs/${org.id}`}
          className="block border-b border-line bg-surface-soft/50 p-5 pb-5 relative hover:bg-surface-soft transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                  <input 
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') { setIsEditingName(false); setEditName(org.name) }
                    }}
                    disabled={isPending}
                    className="h-8 rounded border px-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-xs"
                  />
                  <button onClick={(e) => { e.preventDefault(); handleRename() }} disabled={isPending} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded">
                    {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={(e) => { e.preventDefault(); setIsEditingName(false); setEditName(org.name) }} disabled={isPending} className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors truncate">{org.name}</h2>
                  {!isOwner && <span className="mt-1 inline-block text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">Co-Admin</span>}
                </>
              )}
            </div>

            {/* 3-dot menu */}
            <div className="relative" onClick={e => e.preventDefault()}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-md hover:bg-line text-text-muted hover:text-text transition"
              >
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-9 bg-white rounded-lg shadow-xl border z-20 py-1 w-44 text-sm text-slate-700">
                  {isOwner && (
                    <button onClick={() => { setIsEditingName(true); setShowMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">
                      <Edit2 size={14} /> Rename
                    </button>
                  )}
                  <button onClick={() => { setShowAdmins(!showAdmins); setShowMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">
                    <Users size={14} /> Manage Admins
                  </button>
                  <button onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setShowMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          {/* Invite Code */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Key className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Invite:</span>
            <code className="bg-surface-soft px-1.5 py-0.5 rounded font-mono text-xs font-semibold text-text">{org.invite_code}</code>
            <button onClick={handleCopyCode} className="p-1 hover:bg-surface-soft rounded transition" title="Copy invite code">
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Co-admins count */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{coAdmins.length} co-admin{coAdmins.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Candidates count */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{org.candidate_count ?? 0} candidate{(org.candidate_count ?? 0) !== 1 ? 's' : ''}</span>
          </div>

          {feedback && (
            <div className={`text-xs p-2 rounded ${feedback.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'} flex justify-between`}>
              <span>{feedback.msg}</span>
              <button onClick={() => setFeedback(null)}><X size={14}/></button>
            </div>
          )}

          {/* CO-ADMINS SECTION */}
          {showAdmins && (
            <div className="border-t pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
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
        </div>
      </div>

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
    </>
  )
}
