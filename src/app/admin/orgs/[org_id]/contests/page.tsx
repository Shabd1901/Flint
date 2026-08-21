import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import Link from 'next/link'
import { CreateContestForm } from './CreateContestForm'

export default async function AdminContests({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  
  const { data: contests } = await supabase.from('contests').select('*').eq('org_id', org_id).order('created_at', { ascending: false }) 

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Coding Contests</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">All Contests</h2>
          {contests?.length === 0 ? (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No contests created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {contests?.map((c) => (
                <div key={c.id} className="surface-card hover-lift p-5">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/admin/orgs/${org_id}/contests/${c.id}/problems`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">
                      {c.title}
                    </Link>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.status === 'live' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'closed' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-4 text-xs text-text-muted flex flex-wrap items-center gap-4">
                    <span>Duration: {c.duration_minutes} mins</span>
                    {c.start_at && <span suppressHydrationWarning>Starts: {formatDateTime(c.start_at)}</span>}
                    {c.end_at && <span suppressHydrationWarning>Ends: {formatDateTime(c.end_at)}</span>}
                  </div>
                  <div className="mt-4 pt-4 border-t border-line flex items-center justify-end gap-3">
                    <Link href={`/admin/orgs/${org_id}/contests/${c.id}/results`} className="text-sm font-medium text-accent hover:underline">
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <CreateContestForm orgId={org_id} />
        </div>
      </div>
    </div>
  )
}
