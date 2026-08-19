import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TbdNotice } from '@/components/TbdNotice'

export default async function CandidateContests({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify enrollment
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('org_id', org_id).eq('candidate_id', user.id).single()
  if (!enrollment) redirect('/candidate')

  // Find LIVE contests for this org
  const { data: contests } = await supabase.from('contests').select('*, orgs(name)').eq('org_id', org_id).eq('status', 'live')

  // Find my attempts
  const { data: attempts } = await supabase.from('contest_attempts').select('*').eq('candidate_id', user.id)
  const attemptMap = new Map(attempts?.map(a => [a.contest_id, a]))

  async function startContest(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()

    const contestId = formData.get('contest_id') as string

    // Validate start_at & end_at window
    const { data: c } = await s.from('contests').select('start_at, end_at, status').eq('id', contestId).single()
    if (!c || c.status !== 'live') return

    const now = new Date()
    if (c.start_at && now < new Date(c.start_at)) return
    if (c.end_at && now > new Date(c.end_at)) return

    // Create attempt
    const { data: attempt, error } = await s.from('contest_attempts').insert({
      contest_id: contestId,
      candidate_id: user!.id,
      status: 'in_progress'
    }).select().single()

    if (!error && attempt) {
      redirect(`/candidate/orgs/${org_id}/contests/${contestId}/take`)
    }
  }

  return (
    <TbdNotice
      title="Candidate Coding Contests"
      description="Coding Contests are scheduled for launch in Version 2. All contest participation systems, time window validators, and workspace triggers have been safely preserved."
      backHref={`/candidate/orgs/${org_id}`}
      backLabel="Back to Classroom"
    />
  )
}
