import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { createOrg } from './actions'
import { AdminOrgCard } from './AdminOrgCard'
import { CreateOrgForm } from './CreateOrgForm'

export default async function AdminOrgs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgs, error } = await supabase
    .from('orgs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orgs:', error)
  }

  let finalOrgs = orgs || []
  if (finalOrgs.length > 0) {
    const orgIds = finalOrgs.map(o => o.id)
    
    // Fetch org_admins separately to avoid PostgREST relationship ambiguity errors
    const { data: orgAdminsData } = await supabase
      .from('org_admins')
      .select('org_id, admin_id')
      .in('org_id', orgIds)

    // Fetch candidate enrollments count per org
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('org_id')
      .in('org_id', orgIds)

    const candidateCountsMap = new Map<string, number>()
    if (enrollmentsData) {
      enrollmentsData.forEach(e => {
        candidateCountsMap.set(e.org_id, (candidateCountsMap.get(e.org_id) || 0) + 1)
      })
    }
      
    // Group org_admins by org_id
    const orgAdminsMap = new Map<string, any[]>()
    if (orgAdminsData) {
      orgAdminsData.forEach(oa => {
        if (!orgAdminsMap.has(oa.org_id)) orgAdminsMap.set(oa.org_id, [])
        orgAdminsMap.get(oa.org_id)!.push(oa)
      })
    }

    const adminIds = new Set<string>()
    finalOrgs.forEach(o => {
      adminIds.add(o.admin_id)
      const coAdmins = orgAdminsMap.get(o.id) || []
      coAdmins.forEach(ca => adminIds.add(ca.admin_id))
      o.org_admins = coAdmins
    })

    // Fetch profiles (Requires admin client to bypass RLS which restricts reading other users' profiles)
    const adminSupabase = createAdminClient()
    const { data: profiles } = await adminSupabase.from('profiles').select('id, name, email').in('id', Array.from(adminIds))
    const profileMap = new Map(profiles?.map(p => [p.id, p]))

    finalOrgs = finalOrgs.map(o => ({
      ...o,
      candidate_count: candidateCountsMap.get(o.id) || 0,
      org_admins: o.org_admins?.map((ca: any) => ({
        ...ca,
        profiles: profileMap.get(ca.admin_id)
      }))
    })).filter(o => 
      o.admin_id === user.id || o.org_admins?.some((ca: any) => ca.admin_id === user.id)
    )
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-6xl">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Classrooms</h1>
          <p className="mt-1 text-sm text-text-muted">Click on a classroom to manage exams, assignments, and contests.</p>
        </div>
        <CreateOrgForm />
      </header>

      {finalOrgs && finalOrgs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {finalOrgs.map((org) => (
            <AdminOrgCard key={org.id} org={org} currentUserId={user.id} />
          ))}
        </div>
      ) : (
        <div className="p-16 border border-line border-dashed rounded-xl text-center text-text-muted">
          <p className="text-lg font-medium">No classrooms yet</p>
          <p className="text-sm mt-1">Create your first classroom above to get started.</p>
        </div>
      )}
    </div>
  )
}
