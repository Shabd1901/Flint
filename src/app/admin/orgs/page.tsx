import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createOrg } from './actions'
import { AdminOrgCard } from './AdminOrgCard'

export default async function AdminOrgs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgs, error } = await supabase
    .from('orgs')
    .select('*, org_admins(admin_id, profiles(name, email))')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orgs:', error)
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-5xl">
      <header className="mb-8 flex justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="mt-2 text-sm text-text-muted">Manage your organizations and view invite codes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        <div className="space-y-4">
          {orgs && orgs.length > 0 ? (
            orgs.map(org => (
              <AdminOrgCard key={org.id} org={org} currentUserId={user.id} />
            ))
          ) : (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No organizations found.
            </div>
          )}
        </div>

        <form action={createOrg} className="surface-card p-5 sticky top-8">
          <h2 className="text-lg font-semibold mb-4">Create Organization</h2>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
            <input name="name" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. ABC Classroom" />
          </div>
          <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
            Create
          </button>
        </form>
      </div>
    </div>
  )
}
