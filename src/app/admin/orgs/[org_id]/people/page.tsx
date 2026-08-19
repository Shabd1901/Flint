import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CandidateList, TeacherMember, CandidateMember } from './CandidateList'

export default async function AdminPeoplePage({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase.from('orgs').select('id, name, invite_code, admin_id').eq('id', org_id).single()
  if (!org) notFound()

  // 1. Fetch Teachers / Admins
  const { data: ownerProfile } = await adminClient.from('profiles').select('id, name, email').eq('id', org.admin_id).single()
  const { data: coAdminsData } = await adminClient.from('org_admins').select('admin_id, profiles(id, name, email)').eq('org_id', org.id)

  const teachers: TeacherMember[] = []
  if (ownerProfile) {
    teachers.push({
      id: ownerProfile.id,
      name: ownerProfile.name || ownerProfile.email || 'Classroom Owner',
      email: ownerProfile.email,
      role: 'Owner'
    })
  }

  if (coAdminsData) {
    coAdminsData.forEach(ca => {
      const p = (ca.profiles as any)
      if (p && p.id !== org.admin_id) {
        teachers.push({
          id: p.id,
          name: p.name || p.email || 'Co-Admin',
          email: p.email,
          role: 'Co-Admin'
        })
      }
    })
  }

  // 2. Fetch Enrolled Candidates
  const { data: enrollments } = await adminClient
    .from('enrollments')
    .select('id, created_at, candidate_id, profiles(id, name, email)')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  // 3. Fetch Exam Attempts to calculate candidate activity
  const { data: orgExams } = await supabase.from('exams').select('id').eq('org_id', org.id)
  const examIds = orgExams?.map(e => e.id) || []

  const attemptsMap = new Map<string, { examsTaken: number; violations: number }>()
  if (examIds.length > 0) {
    const { data: attempts } = await adminClient
      .from('exam_attempts')
      .select('candidate_id, violation_score')
      .in('exam_id', examIds)

    if (attempts) {
      attempts.forEach(a => {
        const existing = attemptsMap.get(a.candidate_id) || { examsTaken: 0, violations: 0 }
        attemptsMap.set(a.candidate_id, {
          examsTaken: existing.examsTaken + 1,
          violations: existing.violations + (a.violation_score || 0)
        })
      })
    }
  }

  const candidates: CandidateMember[] = (enrollments || []).map(e => {
    const p = (e.profiles as any)
    const stats = attemptsMap.get(e.candidate_id) || { examsTaken: 0, violations: 0 }

    return {
      id: e.candidate_id,
      name: p?.name || p?.email || 'Candidate',
      email: p?.email || '',
      enrolledAt: e.created_at,
      examsTaken: stats.examsTaken,
      violationCount: stats.violations
    }
  })

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <Link href={`/admin/orgs/${org.id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{org.name}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">People & Candidates</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage teachers, view registered candidates, and track student participation.
          </p>
        </div>
      </div>

      <CandidateList
        orgId={org.id}
        inviteCode={org.invite_code}
        teachers={teachers}
        candidates={candidates}
      />
    </div>
  )
}
