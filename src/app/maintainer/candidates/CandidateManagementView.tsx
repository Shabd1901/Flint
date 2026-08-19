'use client'

import { useState, useTransition } from 'react'
import { GraduationCap, UserX, CheckCircle, Search, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { deleteUserAction } from '../actions'
import { ConfirmModal } from '@/components/ConfirmModal'
import { formatDate } from '@/utils/formatDate'

export interface CandidateItem {
  id: string
  name: string
  email: string
  tp_uid?: string | null
  created_at: string
  enrolled_orgs_count: number
  enrolled_org_names: string[]
}

export function CandidateManagementView({ candidates }: { candidates: CandidateItem[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [candidateToDelete, setCandidateToDelete] = useState<CandidateItem | null>(null)
  const [isDeleting, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const PAGE_SIZE = 20

  // Metrics
  const totalCandidates = candidates.length
  const unassignedCandidates = candidates.filter((c) => c.enrolled_orgs_count === 0).length
  const enrolledCandidates = candidates.filter((c) => c.enrolled_orgs_count > 0).length

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.tp_uid && c.tp_uid.toLowerCase().includes(term))
    )
  })

  // Pagination calculation (20 records per page)
  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE) || 1
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + PAGE_SIZE)

  const handleDeleteConfirm = () => {
    if (!candidateToDelete) return
    setErrorMsg(null)

    startTransition(async () => {
      const res = await deleteUserAction(candidateToDelete.id)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setCandidateToDelete(null)
      }
    })
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      {/* Header */}
      <header className="surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Maintainer Control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Candidate Account Management</h1>
        <p className="mt-1 text-sm text-text-muted">Global directory and enrollment status of all registered candidates.</p>
      </header>

      {/* Metric Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card hover-lift p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Total Registered Candidates</p>
            <p className="mt-2 font-mono text-3xl font-bold text-accent">{totalCandidates}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
        </article>

        <article className="surface-card hover-lift p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Unassigned Candidates</p>
            <p className="mt-2 font-mono text-3xl font-bold text-amber-600">{unassignedCandidates}</p>
            <p className="text-[11px] text-text-muted mt-1">Not enrolled in any classroom</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <UserX size={24} />
          </div>
        </article>

        <article className="surface-card hover-lift p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Enrolled Candidates</p>
            <p className="mt-2 font-mono text-3xl font-bold text-emerald-600">{enrolledCandidates}</p>
            <p className="text-[11px] text-text-muted mt-1">Enrolled in 1+ classrooms</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </article>
      </section>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Table Section */}
      <section className="surface-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg font-bold text-text">Registered Candidate Directory</h2>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search name, email, T&P UID..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
            />
          </div>
        </div>

        {/* Candidate Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-text-muted uppercase tracking-wider font-bold">
                <th className="py-3 px-2">Candidate Name</th>
                <th className="py-3 px-2">TCET Email</th>
                <th className="py-3 px-2">T&amp;P UID</th>
                <th className="py-3 px-2">Enrolled Classrooms</th>
                <th className="py-3 px-2">Registered Date</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b hover:bg-surface-soft/80 transition-colors">
                  <td className="py-3 px-2 font-bold text-text">{candidate.name}</td>
                  <td className="py-3 px-2 text-text-muted font-medium">{candidate.email}</td>
                  <td className="py-3 px-2">
                    {candidate.tp_uid ? (
                      <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        {candidate.tp_uid}
                      </span>
                    ) : (
                      <span className="text-text-muted italic">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {candidate.enrolled_orgs_count > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                        {candidate.enrolled_orgs_count} {candidate.enrolled_orgs_count === 1 ? 'Classroom' : 'Classrooms'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded border border-amber-200">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-text-muted" suppressHydrationWarning>
                    {formatDate(candidate.created_at)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => setCandidateToDelete(candidate)}
                      className="p-1.5 rounded-md hover:bg-rose-50 text-text-muted hover:text-rose-600 transition"
                      title="Delete Candidate Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted font-medium">
                    No candidate accounts found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (20 per page) */}
        {filteredCandidates.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-3">
            <p className="text-xs text-text-muted">
              Showing <span className="font-bold text-text">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-text">{Math.min(startIndex + PAGE_SIZE, filteredCandidates.length)}</span> of{' '}
              <span className="font-bold text-text">{filteredCandidates.length}</span> candidates (20 per page)
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span className="text-xs font-bold px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Delete Candidate Confirmation Modal */}
      {candidateToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Candidate Account"
          message={`Are you sure you want to permanently delete candidate "${candidateToDelete.name}" (${candidateToDelete.email})? This action cannot be undone.`}
          confirmText="Delete Account"
          confirmVariant="danger"
          icon="user-x"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setCandidateToDelete(null)}
        />
      )}
    </div>
  )
}
