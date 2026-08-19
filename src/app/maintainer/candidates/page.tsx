import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { CandidateManagementView, CandidateItem } from './CandidateManagementView'

export const dynamic = 'force-dynamic'

export default async function MaintainerCandidatesPage() {
  const supabase = await createServerClient()

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

  // Use Service Role Client to bypass RLS completely and guarantee fetching 100% of candidate records
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Fetch all profiles
  const { data: allProfiles } = await adminClient
    .from('profiles')
    .select('id, name, email, role, tp_uid, created_at')
    .order('created_at', { ascending: false })

  // 2. Fetch all Auth Users as fallback
  const { data: authUsersData } = await adminClient.auth.admin.listUsers()
  const authUsers = authUsersData?.users || []

  // 3. Fetch all enrollments with org names
  const { data: enrollments } = await adminClient
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

  const profilesMap = new Map<string, any>()
  if (allProfiles) {
    allProfiles.forEach((p: any) => profilesMap.set(p.id, p))
  }

  const candidatesMap = new Map<string, CandidateItem>();

  // Process profiles
  (allProfiles || []).forEach((p: any) => {
    const isCandidate = p.role === 'candidate' || (!p.role && !p.email?.includes('admin') && !p.email?.includes('maintainer'))
    if (isCandidate) {
      const enrollInfo = candidateEnrollmentsMap.get(p.id) || { count: 0, names: [] }
      candidatesMap.set(p.id, {
        id: p.id,
        name: p.name || p.email?.split('@')[0] || 'Candidate',
        email: p.email || '',
        tp_uid: p.tp_uid || null,
        created_at: p.created_at || new Date().toISOString(),
        enrolled_orgs_count: enrollInfo.count,
        enrolled_org_names: enrollInfo.names,
      })
    }
  })

  // Process any Auth users missing from profiles table
  authUsers.forEach((u: any) => {
    const existingProfile = profilesMap.get(u.id)
    const role = existingProfile?.role || u.user_metadata?.role
    const isCandidate = role === 'candidate' || (!role && !u.email?.includes('admin') && !u.email?.includes('maintainer'))

    if (isCandidate && !candidatesMap.has(u.id)) {
      const enrollInfo = candidateEnrollmentsMap.get(u.id) || { count: 0, names: [] }
      candidatesMap.set(u.id, {
        id: u.id,
        name: existingProfile?.name || u.user_metadata?.name || u.email?.split('@')[0] || 'Candidate',
        email: u.email || '',
        tp_uid: existingProfile?.tp_uid || u.user_metadata?.tp_uid || null,
        created_at: u.created_at || new Date().toISOString(),
        enrolled_orgs_count: enrollInfo.count,
        enrolled_org_names: enrollInfo.names,
      })
    }
  })

  const candidatesList = Array.from(candidatesMap.values()) as CandidateItem[]
  const candidates = candidatesList.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return <CandidateManagementView candidates={candidates} />
}
