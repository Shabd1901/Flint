import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ChevronRight, Building } from 'lucide-react'
import { AlertPopup } from './AlertPopup'

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
      redirect(`/candidate?info=You are already part of the organization "${org.name}".`)
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
    <div className="container-page py-6 md:py-8 space-y-6">
      <AlertPopup 
        error={resolvedParams.error} 
        success={resolvedParams.success} 
        info={resolvedParams.info} 
      />

      <header className="surface-card p-5">
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

      <section className="surface-card p-5">
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
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-text">My Classrooms</h2>
            <span className="text-xs text-text-muted font-medium bg-surface-soft px-2.5 py-0.5 rounded-full border">
              {enrollments.length} {enrollments.length === 1 ? 'Classroom' : 'Classrooms'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((e: any) => (
              <Link
                key={e.org_id}
                href={`/candidate/orgs/${e.org_id}/exams`}
                className="surface-card hover-lift p-5 group flex flex-col justify-between h-36 border border-line bg-white hover:border-accent/40 transition-all shadow-sm rounded-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                      Classroom
                    </span>
                    <Building size={16} className="text-text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-text group-hover:text-accent transition-colors line-clamp-1">
                    {e.orgs?.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted font-medium pt-3 border-t border-line/60">
                  <span>View Exams & Tasks</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-accent" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

