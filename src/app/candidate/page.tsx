import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function CandidateDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; info?: string }>
}) {
  const resolvedParams = await searchParams
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

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('org_id, orgs(name)')
    .eq('candidate_id', user.id)

  const orgIds = enrollments?.map(e => e.org_id) || []

  // Fetch real stats
  let pendingExams = 0
  let assignmentsDue = 0
  let recentScore: number | null = null

  if (orgIds.length > 0) {
    // Pending exams: live exams where candidate has no submitted attempt
    const { data: liveExams } = await supabase
      .from('exams')
      .select('id')
      .in('org_id', orgIds)
      .eq('status', 'live')

    const { data: myAttempts } = await supabase
      .from('exam_attempts')
      .select('exam_id, status, score')
      .eq('candidate_id', user.id)
      .order('started_at', { ascending: false })

    const submittedExamIds = new Set(myAttempts?.filter(a => ['submitted', 'auto_submitted'].includes(a.status)).map(a => a.exam_id))
    pendingExams = (liveExams || []).filter(e => !submittedExamIds.has(e.id)).length

    // Recent score
    const latestSubmitted = myAttempts?.find(a => a.score !== null)
    if (latestSubmitted) recentScore = latestSubmitted.score

    // Assignments due (not submitted)
    const { data: allAssignments } = await supabase
      .from('assignments')
      .select('id')
      .in('org_id', orgIds)

    const { data: mySubmissions } = await supabase
      .from('assignment_submissions')
      .select('assignment_id')
      .eq('candidate_id', user.id)

    const submittedAssignmentIds = new Set(mySubmissions?.map(s => s.assignment_id))
    assignmentsDue = (allAssignments || []).filter(a => !submittedAssignmentIds.has(a.id)).length
  }

  async function joinOrg(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    if (!user) redirect('/login')

    const rawInvite = (formData.get('invite_code') as string || '').trim()
    if (!rawInvite) {
      redirect('/candidate?error=Please enter an invite code.')
    }

    const admin = createAdminClient()

    // Case-insensitive lookup for org by invite_code
    const { data: org, error: orgErr } = await admin
      .from('orgs')
      .select('id, name')
      .ilike('invite_code', rawInvite)
      .single()

    if (orgErr || !org) {
      redirect('/candidate?error=Invalid invite code. Please check with your admin.')
    }

    // Check if candidate is already enrolled
    const { data: existing } = await admin
      .from('enrollments')
      .select('id')
      .eq('org_id', org.id)
      .eq('candidate_id', user.id)
      .single()

    if (existing) {
      redirect(`/candidate?info=You are already enrolled in "${org.name}".`)
    }

    // Perform enrollment
    const { error: enrollErr } = await admin.from('enrollments').insert({
      org_id: org.id,
      candidate_id: user.id,
    })

    if (enrollErr) {
      redirect('/candidate?error=Failed to join organization. Please try again.')
    }

    revalidatePath('/candidate')
    redirect(`/candidate?success=Successfully enrolled in "${org.name}"!`)
  }

  return (
    <div className="container-page py-6 md:py-8">
      {resolvedParams.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          {resolvedParams.error}
        </div>
      )}
      {resolvedParams.success && (
        <div className="mb-4 rounded-md bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200">
          {resolvedParams.success}
        </div>
      )}
      {resolvedParams.info && (
        <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm font-medium text-blue-800 border border-blue-200">
          {resolvedParams.info}
        </div>
      )}

      <header className="mb-6 surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Candidate dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome, {profile?.name || 'Candidate'}</h1>
        <p className="mt-1 text-sm text-text-muted">Track exams, assignments, and your submission activity.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Pending exams</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{pendingExams}</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Assignments due</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{assignmentsDue}</p>
        </article>
        <article className="surface-card hover-lift p-5">
          <p className="text-sm text-text-muted">Recent score</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-success">{recentScore !== null ? recentScore : '—'}</p>
        </article>
      </section>

      <section className="mt-4 surface-card p-5">
        <h2 className="text-lg font-semibold">Join an Organization</h2>
        <p className="text-sm text-text-muted mt-1">Enter the invite code shared by your admin to enroll in their class or event.</p>
        <form action={joinOrg} className="mt-4 flex gap-3 items-end">
          <label className="grid gap-1 text-sm flex-1">
            <span className="text-text-muted">Invite Code</span>
            <input name="invite_code" required className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 font-mono uppercase" placeholder="e.g. a3x9f1b2" />
          </label>
          <button className="h-10 rounded-md bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-strong transition">Join</button>
        </form>
      </section>

      {enrollments && enrollments.length > 0 && (
        <section className="mt-4 surface-card p-5">
          <h2 className="text-lg font-semibold">My Organizations</h2>
          <div className="mt-3 space-y-2">
            {enrollments.map((e: any) => (
              <div key={e.org_id} className="flex items-center justify-between rounded-lg border bg-surface-soft p-3">
                <span className="font-medium">{e.orgs?.name}</span>
                <span className="text-xs text-text-muted">Enrolled</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

