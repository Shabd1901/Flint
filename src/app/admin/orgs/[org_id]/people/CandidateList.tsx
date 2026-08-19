'use client'

import { useState, useTransition } from 'react'
import { Search, UserX, Copy, Check, Shield, GraduationCap, RefreshCw, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/utils/formatDate'
import { removeCandidateAction } from './actions'

import { ConfirmModal } from '@/components/ConfirmModal'

export interface TeacherMember {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Co-Admin'
}

export interface CandidateMember {
  id: string
  name: string
  email: string
  enrolledAt: string
  examsTaken: number
  violationCount: number
}

export function CandidateList({
  orgId,
  inviteCode,
  teachers,
  candidates,
}: {
  orgId: string
  inviteCode: string
  teachers: TeacherMember[]
  candidates: CandidateMember[]
}) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const [removingCandidate, setRemovingCandidate] = useState<{ id: string; name: string } | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const pageSize = 10

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + pageSize)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confirmRemove = () => {
    if (!removingCandidate) return
    const candidateId = removingCandidate.id
    startTransition(async () => {
      const res = await removeCandidateAction(orgId, candidateId)
      setRemovingCandidate(null)
      if (res.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setFeedback({ type: 'success', msg: res.success || 'Candidate removed.' })
      }
    })
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Invite Code Quick Banner */}
      <div className="surface-card p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-accent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accent/10 text-accent shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-text">Invite Students to Classroom</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Share the classroom invite code with candidates so they can join directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-text-muted font-medium">Invite Code:</span>
          <code className="bg-surface-soft px-2.5 py-1 rounded font-mono font-bold text-accent text-sm border">
            {inviteCode}
          </code>
          <button
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent-strong transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
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

      {/* SECTION 1: Teachers & Admins */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold tracking-tight text-accent flex items-center gap-2">
            <Shield size={20} />
            Teachers & Admins ({teachers.length})
          </h2>
        </div>

        <div className="divide-y divide-line border rounded-xl bg-white overflow-hidden shadow-sm">
          {teachers.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-surface-soft/40 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center border border-accent/20">
                  {t.name ? t.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <div className="font-semibold text-text text-sm flex items-center gap-2">
                    {t.name}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.role === 'Owner' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {t.role}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{t.email}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: Students & Candidates */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <GraduationCap size={20} className="text-emerald-600" />
              Classroom Candidates
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-soft text-text-muted text-xs font-semibold border">
              {candidates.length} {candidates.length === 1 ? 'student' : 'students'}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search candidate name or email..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="p-12 border border-line border-dashed rounded-xl text-center text-text-muted bg-white">
            {search ? (
              <p>No candidates match your search query "{search}".</p>
            ) : (
              <div>
                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-semibold text-text">No students enrolled yet</p>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Candidates will appear here after enrolling into this classroom using invite code{' '}
                  <code className="font-mono font-bold text-accent">{inviteCode}</code>.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-line border rounded-xl bg-white overflow-hidden shadow-sm">
              {paginatedCandidates.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-surface-soft/40 transition">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center border border-emerald-200 shrink-0">
                      {c.name ? c.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-text text-sm truncate">{c.name}</div>
                      <div className="text-xs text-text-muted truncate mt-0.5">{c.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-medium text-text">
                        {c.examsTaken} {c.examsTaken === 1 ? 'Exam Taken' : 'Exams Taken'}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">Enrolled {formatDate(c.enrolledAt)}</div>
                    </div>

                    {c.violationCount > 0 && (
                      <span
                        className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200"
                        title={`${c.violationCount} total proctoring flags`}
                      >
                        <AlertTriangle size={12} />
                        {c.violationCount} Flag{c.violationCount !== 1 ? 's' : ''}
                      </span>
                    )}

                    <button
                      onClick={() => setRemovingCandidate({ id: c.id, name: c.name })}
                      disabled={isPending && removingCandidate?.id === c.id}
                      className="p-2 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition disabled:opacity-50"
                      title="Remove from classroom"
                    >
                      {isPending && removingCandidate?.id === c.id ? <RefreshCw size={16} className="animate-spin" /> : <UserX size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-text-muted">
                <div>
                  Showing <span className="font-semibold text-text">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-text">
                    {Math.min(startIndex + pageSize, filteredCandidates.length)}
                  </span>{' '}
                  of <span className="font-semibold text-text">{filteredCandidates.length}</span> candidates
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border bg-white font-medium hover:bg-surface-soft disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-md font-semibold text-xs transition ${
                        currentPage === page
                          ? 'bg-accent text-white shadow-sm'
                          : 'border bg-white text-text-muted hover:bg-surface-soft hover:text-text'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border bg-white font-medium hover:bg-surface-soft disabled:opacity-40 transition"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={!!removingCandidate}
        title="Remove Candidate"
        message={`Are you sure you want to remove ${removingCandidate?.name || 'this candidate'} from this classroom? They will lose access to classroom exams and assignments.`}
        confirmText="Remove Candidate"
        confirmVariant="danger"
        icon="user-x"
        isLoading={isPending}
        onConfirm={confirmRemove}
        onClose={() => setRemovingCandidate(null)}
      />
    </div>
  )
}
