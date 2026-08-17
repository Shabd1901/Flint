'use client'

import { useState, useTransition } from 'react'
import {
  Search,
  UserPlus,
  KeyRound,
  Building2,
  Trash2,
  Copy,
  Check,
  Plus,
  ShieldCheck,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { formatDate } from '@/utils/formatDate'
import {
  createAdminAction,
  updateAdminPasswordAction,
  deleteAdminAction,
  assignOrgAdminAction,
  createOrgForAdminAction,
} from './actions'

export interface AdminWithOrgs {
  id: string
  name: string
  email: string
  created_at: string
  orgs: { id: string; name: string; invite_code: string }[]
}

export interface OrgItem {
  id: string
  name: string
  admin_id: string
  invite_code: string
}

export function AdminManagementView({
  admins,
  allOrgs,
}: {
  admins: AdminWithOrgs[]
  allOrgs: OrgItem[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resetModalAdmin, setResetModalAdmin] = useState<AdminWithOrgs | null>(null)
  const [assignModalAdmin, setAssignModalAdmin] = useState<AdminWithOrgs | null>(null)
  const [deleteModalAdmin, setDeleteModalAdmin] = useState<AdminWithOrgs | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Form field states
  const [newPassword, setNewPassword] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [newOrgName, setNewOrgName] = useState('')

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.orgs.some((o) => o.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const res = await createAdminAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.success || 'Admin created successfully!' })
        setShowCreateModal(false)
        form.reset()
      }
    })
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalAdmin) return

    const formData = new FormData()
    formData.append('adminId', resetModalAdmin.id)
    formData.append('newPassword', newPassword)

    startTransition(async () => {
      const res = await updateAdminPasswordAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.success || 'Password updated!' })
        setResetModalAdmin(null)
        setNewPassword('')
      }
    })
  }

  const handleAssignOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignModalAdmin || !selectedOrgId) return

    const formData = new FormData()
    formData.append('adminId', assignModalAdmin.id)
    formData.append('orgId', selectedOrgId)

    startTransition(async () => {
      const res = await assignOrgAdminAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.success || 'Organization reassigned successfully!' })
        setAssignModalAdmin(null)
        setSelectedOrgId('')
      }
    })
  }

  const handleCreateOrgForAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignModalAdmin || !newOrgName.trim()) return

    const formData = new FormData()
    formData.append('adminId', assignModalAdmin.id)
    formData.append('orgName', newOrgName.trim())

    startTransition(async () => {
      const res = await createOrgForAdminAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.success || 'Organization created!' })
        setAssignModalAdmin(null)
        setNewOrgName('')
      }
    })
  }

  const handleDeleteAdmin = async () => {
    if (!deleteModalAdmin) return

    const formData = new FormData()
    formData.append('adminId', deleteModalAdmin.id)

    startTransition(async () => {
      const res = await deleteAdminAction(formData)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: res.success || 'Admin account deleted!' })
        setDeleteModalAdmin(null)
        setDeleteConfirmText('')
      }
    })
  }

  const unassignedOrgsCount = allOrgs.filter((o) => !o.admin_id).length

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      {/* Header */}
      <header className="surface-card p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Maintainer Control</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              <ShieldCheck size={12} /> Admin Directory
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Admin Accounts & Credentials</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage created Admin IDs, credentials, organization assignments, and access lifecycle.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong transition shadow-sm"
        >
          <UserPlus size={18} />
          Create Admin Account
        </button>
      </header>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg p-4 text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="surface-card hover-lift p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Admin IDs</p>
          <p className="mt-2 font-mono text-3xl font-bold">{admins.length}</p>
        </div>

        <div className="surface-card hover-lift p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Managed Orgs</p>
          <p className="mt-2 font-mono text-3xl font-bold text-accent">{allOrgs.length}</p>
        </div>

        <div className="surface-card hover-lift p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Active Assignments</p>
          <p className="mt-2 font-mono text-3xl font-bold text-emerald-600">
            {admins.filter((a) => a.orgs.length > 0).length}
          </p>
        </div>

        <div className="surface-card hover-lift p-5">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Unassigned Admins</p>
          <p className="mt-2 font-mono text-3xl font-bold text-amber-600">
            {admins.filter((a) => a.orgs.length === 0).length}
          </p>
        </div>
      </section>

      {/* Search & Main Table */}
      <section className="surface-card p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck size={20} className="text-accent" />
            Registered Admin Accounts ({filteredAdmins.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search admin, email, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 rounded-lg border bg-surface-soft pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wider text-text-muted bg-surface-soft/50">
                <th className="py-3 px-4">Admin Name & Email</th>
                <th className="py-3 px-4">Admin ID (UUID)</th>
                <th className="py-3 px-4">Assigned Organization(s)</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-surface-soft/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-text">{admin.name}</div>
                    <div className="text-xs text-text-muted font-mono">{admin.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <code className="rounded bg-surface-soft px-2 py-1 text-xs font-mono text-text">
                        {admin.id.substring(0, 8)}...{admin.id.substring(admin.id.length - 4)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(admin.id)}
                        title="Copy full Admin ID"
                        className="p-1 text-text-muted hover:text-accent transition rounded"
                      >
                        {copiedId === admin.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {admin.orgs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {admin.orgs.map((org) => (
                          <span
                            key={org.id}
                            className="inline-flex items-center gap-1 rounded-md border bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            <Building2 size={12} className="text-text-muted" />
                            {org.name}
                            <code className="text-[10px] text-text-muted bg-slate-200/60 px-1 rounded">
                              {org.invite_code}
                            </code>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-xs text-text-muted" suppressHydrationWarning>
                    {formatDate(admin.created_at)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setAssignModalAdmin(admin)
                          setSelectedOrgId('')
                          setNewOrgName('')
                        }}
                        title="Manage Org Link"
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-accent/40 hover:bg-orange-50 hover:text-accent transition"
                      >
                        <Building2 size={14} />
                        Link Org
                      </button>

                      <button
                        onClick={() => {
                          setResetModalAdmin(admin)
                          setNewPassword('')
                        }}
                        title="Reset Admin Password"
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"
                      >
                        <KeyRound size={14} />
                        Reset Password
                      </button>

                      <button
                        onClick={() => {
                          setDeleteModalAdmin(admin)
                          setDeleteConfirmText('')
                        }}
                        title="Delete Admin Account"
                        className="p-1.5 rounded-md border text-text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No admin accounts found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md p-6 relative shadow-xl animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2">
              <UserPlus size={20} className="text-accent" />
              Create New Admin Account
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Generates a new secure Admin ID profile with full privileges for organization administration.
            </p>

            <form onSubmit={handleCreateAdmin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Connor"
                  className="w-full h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@university.edu"
                  className="w-full h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Initial Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 px-4 rounded-md border text-sm font-medium text-text-muted hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-4 rounded-md bg-accent text-sm font-medium text-white hover:bg-accent-strong transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md p-6 relative shadow-xl">
            <button
              onClick={() => setResetModalAdmin(null)}
              className="absolute right-4 top-4 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2">
              <KeyRound size={20} className="text-blue-600" />
              Reset Admin Password
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Update password for <span className="font-semibold text-text">{resetModalAdmin.name}</span> (
              {resetModalAdmin.email}).
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalAdmin(null)}
                  className="h-9 px-4 rounded-md border text-sm font-medium text-text-muted hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newPassword}
                  className="h-9 px-4 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE / LINK ORG MODAL */}
      {assignModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-lg p-6 relative shadow-xl">
            <button
              onClick={() => setAssignModalAdmin(null)}
              className="absolute right-4 top-4 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building2 size={20} className="text-accent" />
              Manage Organization for {assignModalAdmin.name}
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Link an existing organization or create a brand new organization assigned to this Admin ID.
            </p>

            <div className="mt-5 space-y-6">
              {/* Option 1: Reassign existing Org */}
              <form onSubmit={handleAssignOrg} className="border-b pb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Option 1: Assign Existing Organization
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="flex-1 h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                  >
                    <option value="">Select Organization...</option>
                    {allOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} {org.admin_id === assignModalAdmin.id ? '(Currently Assigned)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isPending || !selectedOrgId}
                    className="h-10 px-4 rounded-md bg-accent text-xs font-semibold text-white hover:bg-accent-strong transition disabled:opacity-50 shrink-0"
                  >
                    Reassign Org
                  </button>
                </div>
              </form>

              {/* Option 2: Create new Org */}
              <form onSubmit={handleCreateOrgForAdmin}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Option 2: Create & Link New Organization
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Stanford CS Department"
                    className="flex-1 h-10 rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isPending || !newOrgName.trim()}
                    className="h-10 px-4 rounded-md bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 shrink-0 flex items-center gap-1"
                  >
                    <Plus size={14} /> Create & Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card w-full max-w-md p-6 relative shadow-xl border-rose-200">
            <button
              onClick={() => setDeleteModalAdmin(null)}
              className="absolute right-4 top-4 text-text-muted hover:text-text"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <Trash2 size={20} />
              Delete Admin Account?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Are you sure you want to delete <span className="font-semibold text-text">{deleteModalAdmin.name}</span> (
              {deleteModalAdmin.email})?
            </p>
            <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <strong>Warning:</strong> This will permanently delete the admin user authentication and cascade delete
              their owned organization structure.
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
                onClick={() => setDeleteModalAdmin(null)}
                className="h-9 px-4 rounded-md border text-sm font-medium text-text-muted hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
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
