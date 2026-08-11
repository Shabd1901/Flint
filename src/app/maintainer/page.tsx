import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function MaintainerDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'maintainer') {
    redirect('/')
  }

  const { data: orgs } = await supabase.from('orgs').select('id, name, created_at, invite_code, profiles(name, email)')
  const { data: exams } = await supabase.from('exams').select('id, title, status, orgs(name)')
  const { data: allProfiles } = await supabase.from('profiles').select('id, name, email, role').order('created_at', { ascending: false })
  const { data: violations } = await supabase
    .from('violation_events')
    .select('id, type, occurred_at, exam_attempts(profiles(name), exams(title))')
    .order('occurred_at', { ascending: false })
    .limit(10)

  async function createAdmin(formData: FormData) {
    'use server'
    const { createClient: createSB } = await import('@supabase/supabase-js')
    const adminClient = createSB(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data: { user }, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError || !user) return

    await adminClient.from('profiles').insert({
      id: user.id,
      role: 'admin',
      name,
      email
    })
  }

  return (
    <div className="container-page py-6 md:py-8">
      <header className="mb-6 surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Maintainer control</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Cross-org operations dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Global visibility for health, integrity, and intervention.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Organizations</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{orgs?.length || 0}</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Exams</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{exams?.length || 0}</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Users</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{allProfiles?.length || 0}</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Integrity events</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-danger">{violations?.length || 0}</p>
        </article>
      </section>

      <section className="mt-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Create Admin Account</h2>
        <p className="text-sm text-text-muted mt-1">Only maintainers can create admin accounts.</p>
        <form action={createAdmin} className="mt-4 flex flex-wrap gap-3 items-end">
          <label className="grid gap-1 text-sm">
            <span className="text-text-muted">Name</span>
            <input name="name" required className="h-9 w-40 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" placeholder="Admin Name" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-text-muted">Email</span>
            <input name="email" type="email" required className="h-9 w-52 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" placeholder="admin@org.edu" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-text-muted">Password</span>
            <input name="password" type="password" required minLength={6} className="h-9 w-40 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" placeholder="••••••••" />
          </label>
          <button className="h-9 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-strong transition">Create Admin</button>
        </form>
      </section>

      <section className="mt-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-text-muted">
                <th className="py-2">Name</th>
                <th className="py-2">Admin</th>
                <th className="py-2">Invite Code</th>
                <th className="py-2">Created at</th>
              </tr>
            </thead>
            <tbody>
              {orgs?.map((org: any) => (
                <tr key={org.id} className="border-b hover:bg-surface-soft/70">
                  <td className="py-2 font-medium">{org.name}</td>
                  <td className="py-2 text-text-muted">{org.profiles?.name} ({org.profiles?.email})</td>
                  <td className="py-2"><code className="rounded bg-surface-soft px-2 py-0.5 text-xs font-mono">{org.invite_code}</code></td>
                  <td className="py-2 text-text-muted">{new Date(org.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!orgs || orgs.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">No organizations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Recent violations</h2>
        <div className="mt-3 overflow-x-auto">
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
              {violations?.slice(0, 10).map((v: any) => (
                <tr key={v.id} className="border-b hover:bg-surface-soft/70">
                  <td className="py-2">{v.exam_attempts?.profiles?.name}</td>
                  <td className="py-2 text-text-muted">{v.exam_attempts?.exams?.title}</td>
                  <td className="py-2">
                    <span className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">{v.type}</span>
                  </td>
                  <td className="py-2 text-text-muted">{new Date(v.occurred_at).toLocaleString()}</td>
                </tr>
              ))}
              {(!violations || violations.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">No violations recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
