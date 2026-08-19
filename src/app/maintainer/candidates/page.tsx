import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CandidateManagementView, CandidateItem } from './CandidateManagementView'

export const dynamic = 'force-dynamic'

export default async function MaintainerCandidatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'maintainer') {
    redirect('/')
  }

  // Fetch all candidate profiles
  const { data: candidateProfiles } = await supabase
    .from('profiles')
    .select('id, name, email, tp_uid, created_at')
    .eq('role', 'candidate')
    .order('created_at', { ascending: false })

  // Fetch enrollments with org names
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('candidate_id, org_id, orgs(name)')

  // Group enrollments per candidate
  const candidateEnrollmentsMap = new Map<string, { count: number; names: string[] }>()

  if (enrollments) {
    enrollments.forEach((e: any) => {
      const candidateId = e.candidate_id
      const orgName = e.orgs?.name || 'Classroom'
      if (!candidateEnrollmentsMap.has(candidateId)) {
        candidateEnrollmentsMap.set(candidateId, { count: 0, names: [] })
      }
      const item = candidateEnrollmentsMap.get(candidateId)!
      item.count += 1
      item.names.push(orgName)
    })
  }

  const candidates: CandidateItem[] = (candidateProfiles || []).map((candidate) => {
    const enrollInfo = candidateEnrollmentsMap.get(candidate.id) || { count: 0, names: [] }
    return {
      id: candidate.id,
      name: candidate.name || 'Candidate',
      email: candidate.email || '',
      tp_uid: candidate.tp_uid || null,
      created_at: candidate.created_at,
      enrolled_orgs_count: enrollInfo.count,
      enrolled_org_names: enrollInfo.names,
    }
  })

  return <CandidateManagementView candidates={candidates} />
}
