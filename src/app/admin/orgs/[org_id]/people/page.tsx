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
  const { data: coAdminsData } = await adminClient.from('org_admins').select('admin_id').eq('org_id', org.id)

  const adminIdsSet = new Set<string>()
  if (org.admin_id) adminIdsSet.add(org.admin_id)
  coAdminsData?.forEach(ca => adminIdsSet.add(ca.admin_id))

  const { data: adminProfiles } = adminIdsSet.size > 0
    ? await adminClient.from('profiles').select('id, name, email').in('id', Array.from(adminIdsSet))
    : { data: [] }

  const adminProfileMap = new Map(adminProfiles?.map(p => [p.id, p]) || [])

  const teachers: TeacherMember[] = []
  if (ownerProfile) {
    teachers.push({
      id: ownerProfile.id,
      name: ownerProfile.name || ownerProfile.email || 'Classroom Owner',
      email: ownerProfile.email,
      role: 'Owner'
    })
  }

  coAdminsData?.forEach(ca => {
    if (ca.admin_id !== org.admin_id) {
      const p = adminProfileMap.get(ca.admin_id)
      teachers.push({
        id: ca.admin_id,
        name: p?.name || p?.email || 'Co-Admin',
        email: p?.email || '',
        role: 'Co-Admin'
      })
    }
  })

  // 2. Fetch Candidates enrolled in this org
  const { data: enrollments } = await adminClient
    .from('enrollments')
    .select('id, joined_at, candidate_id')
    .eq('org_id', org.id)
    .order('joined_at', { ascending: false })

  // 3. Fetch Exam & Assignment activity for org
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

  // Collect candidate IDs from enrollments & attempts
  const candidateIdSet = new Set<string>()
  const enrollmentDateMap = new Map<string, string>()

  enrollments?.forEach(e => {
    candidateIdSet.add(e.candidate_id)
    enrollmentDateMap.set(e.candidate_id, e.joined_at)
  })

  // Also include candidates who attempted exams for this org even if enrollment record was missing
  attemptsMap.forEach((_, candId) => {
    candidateIdSet.add(candId)
    if (!enrollmentDateMap.has(candId)) {
      enrollmentDateMap.set(candId, new Date().toISOString())
    }
  })

  // Fetch profiles for all candidates
  const candidateIds = Array.from(candidateIdSet)
  const { data: candidateProfiles } = candidateIds.length > 0
    ? await adminClient.from('profiles').select('id, name, email').in('id', candidateIds)
    : { data: [] }

  const candidateProfileMap = new Map(candidateProfiles?.map(p => [p.id, p]) || [])

  const candidates: CandidateMember[] = candidateIds.map(candId => {
    const p = candidateProfileMap.get(candId)
    const stats = attemptsMap.get(candId) || { examsTaken: 0, violations: 0 }

    return {
      id: candId,
      name: p?.name || p?.email || 'Candidate',
      email: p?.email || '',
      enrolledAt: enrollmentDateMap.get(candId) || new Date().toISOString(),
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
