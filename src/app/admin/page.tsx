import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { IntegrityFeed } from './IntegrityFeed'
import { Activity, Users, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', user.id).single()
  const { data: org } = await supabase.from('orgs').select('id, name, invite_code').eq('admin_id', user.id).single()

  let examCount = 0
  let candidateCount = 0
  let activeSessionsCount = 0
  let reviewQueue: any[] = []
  let recentEvents: any[] = []

  if (org) {
    const { count: ec } = await supabase.from('exams').select('id', { count: 'exact', head: true }).eq('org_id', org.id)
    examCount = ec || 0

    const { count: cc } = await supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('org_id', org.id)
    candidateCount = cc || 0

    const { data: orgExams } = await supabase.from('exams').select('id, title').eq('org_id', org.id)
    const examMap = new Map(orgExams?.map(e => [e.id, e.title]) || [])
    const examIds = orgExams?.map(e => e.id) || []
    
    if (examIds.length > 0) {
      // 1. Fetch High-Score + High-Violation Queue
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

      // 2. Fetch Active Sessions (in_progress with recent heartbeat)
      const fifteenSecsAgo = new Date(Date.now() - 15000).toISOString()
      const { count: activeCount } = await supabase
        .from('exam_attempts')
        .select('id', { count: 'exact', head: true })
        .in('exam_id', examIds)
        .eq('status', 'in_progress')
        .gte('last_heartbeat', fifteenSecsAgo)
      activeSessionsCount = activeCount || 0

      // 3. Fetch Integrity Feed (Recent Events)
      const { data: events } = await supabase
        .from('violation_events')
        .select('id, type, occurred_at, attempt_id')
        .order('occurred_at', { ascending: false })
        .limit(20)

      // Get candidate names for these events
      if (events && events.length > 0) {
        const attemptIds = events.map(e => e.attempt_id)
        const { data: attemptDetails } = await supabase
          .from('exam_attempts')
          .select('id, exam_id, profiles(name)')
          .in('id', attemptIds)
        
        const detailsMap = new Map(attemptDetails?.map(a => [a.id, a]) || [])
        
        recentEvents = events.map(e => {
          const detail = detailsMap.get(e.attempt_id) as any
          return {
            ...e,
            candidate_name: detail?.profiles?.name || 'Unknown',
            exam_title: examMap.get(detail?.exam_id) || 'Unknown Exam'
          }
        })
      }
    }
  }

  async function createOrg(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    await s.from('orgs').insert({ admin_id: user!.id, name: formData.get('org_name') })
    revalidatePath('/admin')
  }

  return (
    <div className="container-page py-6 md:py-8 max-w-7xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Overview Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Mission Control</h1>
          <p className="mt-2 text-sm text-text-muted max-w-xl">
            Monitor active sessions, review high-risk candidates, and manage your organization's assessments.
          </p>
        </div>
        
        {org && (
          <div className="flex items-center gap-4 bg-white border shadow-sm px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Server Health: Optimal</span>
            </div>
            <div className="w-px h-4 bg-line"></div>
            <div className="text-sm">
              <span className="text-text-muted mr-2">Org Code:</span>
              <code className="bg-surface-soft px-2 py-0.5 rounded font-mono font-semibold">{org.invite_code}</code>
            </div>
          </div>
        )}
      </header>

      {!org ? (
        <section className="surface-card p-8 border-dashed border-2 text-center max-w-xl mx-auto mt-12">
          <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-semibold">Create Your Organization</h2>
          <p className="text-sm text-text-muted mt-2 mb-6">Initialize your tenant to start creating exams, inviting candidates, and monitoring integrity.</p>
          <form action={createOrg} className="flex flex-col gap-3">
            <input name="org_name" required className="h-11 rounded-md border bg-white px-4 outline-none ring-accent focus:ring-2 w-full text-center" placeholder="e.g. Acme Corp Hiring" />
            <button className="h-11 rounded-md bg-accent px-6 font-semibold text-white hover:bg-accent-strong transition shadow-sm hover:-translate-y-0.5">Initialize Tenant</button>
          </form>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          
          <div className="space-y-6">
            {/* Live Metrics Grid */}
            <section className="grid gap-4 sm:grid-cols-3">
              <article className="surface-card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-12 h-12" />
                </div>
                <p className="text-sm font-medium text-text-muted">Total Candidates</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="font-mono text-4xl font-semibold tracking-tight">{candidateCount}</p>
                </div>
              </article>
              
              <article className="surface-card p-5 relative overflow-hidden group border-accent/20 bg-accent/5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-accent">
                  <Activity className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                  <p className="text-sm font-medium text-text-muted">Active Sessions</p>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="font-mono text-4xl font-semibold tracking-tight text-accent">{activeSessionsCount}</p>
                </div>
              </article>
              
              <article className="surface-card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <p className="text-sm font-medium text-text-muted">Active Exams</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="font-mono text-4xl font-semibold tracking-tight">{examCount}</p>
                </div>
              </article>
            </section>

            {/* Candidate Review Queue */}
            <section className="surface-card overflow-hidden">
              <div className="p-5 border-b bg-surface-soft/30 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold">Priority Review Queue</h2>
                  <p className="text-xs text-text-muted mt-0.5">High-score candidates with integrity flags</p>
                </div>
                <Link href="/admin/exams" className="text-xs font-semibold text-accent hover:underline">View all exams</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-surface-soft/50 text-text-muted text-xs uppercase tracking-wider">
                      <th className="py-3 px-5 font-medium">Candidate</th>
                      <th className="py-3 px-5 font-medium">Score</th>
                      <th className="py-3 px-5 font-medium">Violation Index</th>
                      <th className="py-3 px-5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {reviewQueue.map((item, i) => (
                      <tr key={i} className="hover:bg-surface-soft/70 transition-colors group">
                        <td className="py-3 px-5 font-medium">{item.candidate}</td>
                        <td className="py-3 px-5 font-mono">{item.score}</td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{item.violation}</span>
                            {item.violation > 0 && (
                              <div className="h-1.5 w-16 bg-surface-soft rounded-full overflow-hidden">
                                <div className={`h-full ${item.violation >= 5 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, item.violation * 10)}%` }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.status === 'Review' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reviewQueue.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-text-muted">
                          <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          No candidates require review at this time.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Sidebar: Integrity Feed */}
          <div className="h-[600px] sticky top-6">
            <IntegrityFeed initialEvents={recentEvents} orgId={org.id} />
          </div>

        </div>
      )}
    </div>
  )
}
