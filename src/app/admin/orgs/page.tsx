import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createOrg, deleteOrg, updateOrg } from './actions'
import { Building, Trash2, Edit2, Key, Users } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrgs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgs } = await supabase.from('orgs').select('*').order('created_at', { ascending: false })
  
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
              <div key={org.id} className="surface-card p-5 group flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold">{org.name}</h2>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                    <Key className="w-4 h-4" />
                    <span>Invite Code:</span>
                    <code className="bg-surface-soft px-1.5 rounded font-mono text-xs">{org.invite_code}</code>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/orgs/${org.id}`} className="p-2 text-text-muted hover:text-accent hover:bg-surface-soft rounded-md transition" title="Manage Roster">
                    <Users className="w-4 h-4" />
                  </Link>
                  <form action={deleteOrg}>
                    <input type="hidden" name="id" value={org.id} />
                    <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition" title="Delete Organization">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
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
            <input name="name" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Acme Corp Hiring" />
          </div>
          <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
            Create
          </button>
        </form>
      </div>
    </div>
  )
}
