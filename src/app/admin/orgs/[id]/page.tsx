import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { RosterUploader } from './RosterUploader'

export default async function OrgRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: org } = await supabase.from('orgs').select('*').eq('id', id).single()
  
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, profiles(name, email)')
    .eq('org_id', id)
    .order('joined_at', { ascending: false })

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-4xl">
      <Link href="/admin/orgs" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Organizations
      </Link>

      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roster: {org?.name}</h1>
          <p className="text-text-muted mt-1">{enrollments?.length || 0} enrolled candidates</p>
        </div>
        <RosterUploader orgId={id} />
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-surface-soft/40 text-text-muted text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Candidate</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {enrollments?.map(en => {
              const profile = en.profiles as any
              return (
                <tr key={en.id} className="hover:bg-surface-soft/40 transition-colors">
                  <td className="px-5 py-3 font-medium">{profile?.name || 'Pending Invite'}</td>
                  <td className="px-5 py-3 font-mono">{profile?.email || 'N/A'}</td>
                  <td className="px-5 py-3 text-text-muted">{new Date(en.joined_at).toLocaleDateString()}</td>
                </tr>
              )
            })}
            {(!enrollments || enrollments.length === 0) && (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-text-muted">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No candidates enrolled yet. Upload a roster to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
