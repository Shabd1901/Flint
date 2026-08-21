import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import { CreateAssignmentForm } from './CreateAssignmentForm'

export default async function AdminAssignments({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: assignments } = await supabase.from('assignments').select('*').eq('org_id', org_id).order('created_at', { ascending: false })

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Assignments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">Active Assignments</h2>
          {assignments?.length === 0 ? (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No assignments created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {assignments?.map((a) => (
                <div key={a.id} className="surface-card hover-lift p-5">
                  <div className="flex justify-between items-start mb-2">
                    <a href={`/admin/orgs/${org_id}/assignments/${a.id}`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">{a.title}</a>
                    <span className="text-sm px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-medium">Max Score: {a.max_score}</span>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-2">{a.instructions}</p>
                  <div className="mt-4 text-xs text-text-muted flex items-center gap-4">
                    <span suppressHydrationWarning>Due: {formatDateTime(a.due_at)}</span>
                    {a.allowed_file_types && (
                      <span className="bg-surface-soft px-2 py-0.5 rounded font-mono">
                        Formats: {Array.isArray(a.allowed_file_types) ? a.allowed_file_types.join(', ') : a.allowed_file_types}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <CreateAssignmentForm orgId={org_id} />
        </div>
      </div>
    </div>
  )
}
