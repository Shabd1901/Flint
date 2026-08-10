import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const reviewQueue = [
  { candidate: 'Aditi Sharma', score: 88, violation: 12, status: 'Review' },
  { candidate: 'Rahul Verma', score: 84, violation: 9, status: 'Review' },
  { candidate: 'Nisha Khan', score: 81, violation: 4, status: 'Clear' },
]

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

  return (
    <div className="container-page py-6 md:py-8">
      <header className="mb-6 surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Admin dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome, {profile?.name || 'Admin'}</h1>
        <p className="mt-1 text-sm text-text-muted">Manage exams, assignments, and integrity review queues.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Active exam windows</p>
          <p className="mt-2 font-mono text-3xl font-semibold">2</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Candidates live</p>
          <p className="mt-2 font-mono text-3xl font-semibold">172</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Flagged events (1h)</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-warning">18</p>
        </article>
      </section>

      <section className="mt-4 surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="flex gap-2">
            <button className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Create exam</button>
            <button className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Create assignment</button>
            <button className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong">Export shortlist</button>
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
