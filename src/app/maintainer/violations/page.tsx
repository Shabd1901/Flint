import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/utils/formatDate'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default async function ViolationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const PAGE_SIZE = 20
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'maintainer') {
    redirect('/')
  }

  const { data: violations, count: totalViolationsCount } = await supabase
    .from('violation_events')
    .select('id, type, occurred_at, exam_attempts(profiles(name), exams(title))', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(from, to)

  const totalViolations = totalViolationsCount || 0

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <header className="surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Maintainer Control</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Integrity Violations</h1>
        <p className="mt-1 text-sm text-text-muted">Global view of all proctoring violations across all organizations.</p>
      </header>

      <section className="surface-card p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-text-muted">
                <th className="py-2">Candidate</th>
                <th className="py-2">Exam</th>
                <th className="py-2">Violation type</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {violations?.map((v: any) => (
                <tr key={v.id} className="border-b hover:bg-surface-soft/70">
                  <td className="py-2">{v.exam_attempts?.profiles?.name}</td>
                  <td className="py-2 text-text-muted">{v.exam_attempts?.exams?.title}</td>
                  <td className="py-2">
                    <span className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">{v.type}</span>
                  </td>
                  <td className="py-2 text-text-muted" suppressHydrationWarning>{formatDateTime(v.occurred_at)}</td>
                </tr>
              ))}
              {(!violations || violations.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">No violations recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalViolations > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t pt-4 mt-6">
              <p className="text-sm text-text-muted">
                Showing <span className="font-medium">{from + 1}</span> to <span className="font-medium">{Math.min(to + 1, totalViolations)}</span> of <span className="font-medium">{totalViolations}</span> violations
              </p>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <a href={`/maintainer/violations?page=${currentPage - 1}`} className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-surface-soft transition">
                    <ChevronLeft size={16} /> Prev
                  </a>
                ) : (
                  <button disabled className="inline-flex items-center gap-1 rounded-md border bg-surface-soft px-3 py-1.5 text-sm font-medium text-text-muted opacity-50 cursor-not-allowed">
                    <ChevronLeft size={16} /> Prev
                  </button>
                )}
                
                {currentPage * PAGE_SIZE < totalViolations ? (
                  <a href={`/maintainer/violations?page=${currentPage + 1}`} className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-surface-soft transition">
                    Next <ChevronRight size={16} />
                  </a>
                ) : (
                  <button disabled className="inline-flex items-center gap-1 rounded-md border bg-surface-soft px-3 py-1.5 text-sm font-medium text-text-muted opacity-50 cursor-not-allowed">
                    Next <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
