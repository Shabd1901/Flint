import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const upcoming = [
  { title: 'Hackathon Round 1', starts: 'Today, 10:00', duration: '60 min', status: 'Live soon' },
  { title: 'Club Aptitude Test', starts: 'Fri, 14:00', duration: '45 min', status: 'Scheduled' },
]

const assignments = [
  { title: 'Build API endpoint', due: 'Tomorrow', submitted: 'No' },
  { title: 'Frontend UX critique', due: 'Aug 16', submitted: 'Yes' },
]

export default async function CandidateDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="container-page py-6 md:py-8">
      <header className="mb-6 surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Candidate dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome, {profile?.name || 'Candidate'}</h1>
        <p className="mt-1 text-sm text-text-muted">Track exams, assignments, and your submission activity.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Pending exams</p>
          <p className="mt-2 font-mono text-3xl font-semibold">2</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Assignments due</p>
          <p className="mt-2 font-mono text-3xl font-semibold">1</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Recent score</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-success">81</p>
        </article>
      </section>

      <section className="mt-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Upcoming exams</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b text-text-muted">
                <th className="py-2">Exam</th>
                <th className="py-2">Starts</th>
                <th className="py-2">Duration</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((exam) => (
                <tr key={exam.title} className="border-b hover:bg-surface-soft/70">
                  <td className="py-2">{exam.title}</td>
                  <td className="py-2">{exam.starts}</td>
                  <td className="py-2">{exam.duration}</td>
                  <td className="py-2">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">{exam.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Assignments</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b text-text-muted">
                <th className="py-2">Assignment</th>
                <th className="py-2">Due</th>
                <th className="py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.title} className="border-b hover:bg-surface-soft/70">
                  <td className="py-2">{a.title}</td>
                  <td className="py-2">{a.due}</td>
                  <td className="py-2">{a.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
