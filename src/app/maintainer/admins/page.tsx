import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminManagementView, AdminWithOrgs, OrgItem } from './AdminManagementView'

export const dynamic = 'force-dynamic'

export default async function MaintainerAdminsPage() {
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

  // Fetch all admin profiles
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, name, email, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  // Fetch all orgs
  const { data: rawOrgs } = await supabase
    .from('orgs')
    .select('id, name, admin_id, invite_code')
    .order('name', { ascending: true })

  const allOrgs: OrgItem[] = rawOrgs || []

  // Combine admins with their associated orgs
  const admins: AdminWithOrgs[] = (adminProfiles || []).map((admin) => {
    const linkedOrgs = allOrgs.filter((org) => org.admin_id === admin.id)
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      created_at: admin.created_at,
      orgs: linkedOrgs.map((o) => ({ id: o.id, name: o.name, invite_code: o.invite_code })),
    }
  })

  return <AdminManagementView admins={admins} allOrgs={allOrgs} />
}
