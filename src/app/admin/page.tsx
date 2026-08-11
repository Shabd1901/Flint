import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single()

  // Fetch admin's org
  const { data: org } = await supabase.from('orgs').select('id, name, invite_code').eq('admin_id', user.id).single()

  // Fetch real stats if org exists
  let examCount = 0
  let candidateCount = 0
  let violationCount = 0
  let reviewQueue: any[] = []

  if (org) {
    const { count: ec } = await supabase.from('exams').select('id', { count: 'exact', head: true }).eq('org_id', org.id)
    examCount = ec || 0

    const { count: cc } = await supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('org_id', org.id)
    candidateCount = cc || 0

    // Recent violations for this org's exams
    const { data: orgExams } = await supabase.from('exams').select('id').eq('org_id', org.id)
    const examIds = orgExams?.map(e => e.id) || []
    
    if (examIds.length > 0) {
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('id, score, violation_score, status, profiles(name)')
        .in('exam_id', examIds)
        .order('violation_score', { ascending: false })
        .limit(10)

      reviewQueue = (attempts || [])
        .filter(a => a.status === 'submitted' && (a.violation_score || 0) > 0)
        .map(a => ({
          candidate: (a.profiles as any)?.name || 'Unknown',
          score: a.score ?? '-',
          violation: a.violation_score ?? 0,
          status: (a.violation_score || 0) >= 5 ? 'Review' : 'Clear'
        }))

      // Count violations in last hour
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      const { data: recentAttempts } = await supabase
        .from('exam_attempts')
        .select('id')
        .in('exam_id', examIds)

      if (recentAttempts && recentAttempts.length > 0) {
        const attemptIds = recentAttempts.map(a => a.id)
        const { count: vc } = await supabase
          .from('violation_events')
          .select('id', { count: 'exact', head: true })
          .in('attempt_id', attemptIds)
          .gte('occurred_at', oneHourAgo)
        violationCount = vc || 0
      }
    }
  }

  async function createOrg(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    
    await s.from('orgs').insert({
      admin_id: user!.id,
      name: formData.get('org_name'),
    })
    revalidatePath('/admin')
  }

  return (
    <div className="container-page py-6 md:py-8">
      <header className="mb-6 surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Admin dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome, {profile?.name || 'Admin'}</h1>
        <p className="mt-1 text-sm text-text-muted">Manage exams, assignments, and integrity review queues.</p>
      </header>

      {!org ? (
        <section className="surface-card p-6">
          <h2 className="text-lg font-semibold">Create Your Organization</h2>
          <p className="text-sm text-text-muted mt-1">You need an organization before creating exams or assignments.</p>
          <form action={createOrg} className="mt-4 flex gap-3 items-end">
            <label className="grid gap-1 text-sm flex-1">
              <span className="text-text-muted">Organization Name</span>
              <input name="org_name" required className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. CS101 - Fall 2026" />
            </label>
            <button className="h-10 rounded-md bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-strong transition">Create</button>
          </form>
        </section>
      ) : (
        <>
          <section className="mb-4 surface-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Organization</p>
                <p className="font-semibold">{org.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Invite Code</p>
                <code className="rounded bg-surface-soft px-3 py-1 text-sm font-mono font-semibold">{org.invite_code}</code>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="surface-card hover-lift p-5">
              <p className="text-sm text-text-muted">Active exams</p>
              <p className="mt-2 font-mono text-3xl font-semibold">{examCount}</p>
            </article>
            <article className="surface-card hover-lift p-5">
              <p className="text-sm text-text-muted">Enrolled candidates</p>
              <p className="mt-2 font-mono text-3xl font-semibold">{candidateCount}</p>
            </article>
            <article className="surface-card hover-lift p-5">
              <p className="text-sm text-text-muted">Flagged events (1h)</p>
              <p className="mt-2 font-mono text-3xl font-semibold text-warning">{violationCount}</p>
            </article>
          </section>

          <section className="mt-4 surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <div className="flex gap-2">
                <Link href="/admin/exams" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Create exam</Link>
                <Link href="/admin/assignments" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Create assignment</Link>
                <button disabled className="rounded-md bg-surface-soft px-3 py-2 text-sm font-medium text-text-muted cursor-not-allowed" title="Coming in Phase 2">Export shortlist</button>
              </div>
            </div>
          </section>

          <section className="mt-4 surface-card p-5">
            <h2 className="text-lg font-semibold">High-score + high-violation review queue</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b text-text-muted">
                    <th className="py-2">Candidate</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Violation score</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewQueue.map((item) => (
                    <tr key={item.candidate} className="border-b hover:bg-surface-soft/70">
                      <td className="py-2">{item.candidate}</td>
                      <td className="py-2">{item.score}</td>
                      <td className="py-2">{item.violation}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            item.status === 'Review' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reviewQueue.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-text-muted">No flagged candidates yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
