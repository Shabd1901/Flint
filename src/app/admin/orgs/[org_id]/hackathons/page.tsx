import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import { CreateHackathonForm } from './CreateHackathonForm'
import { HackathonStatusToggle } from './HackathonStatusToggle'

export default async function AdminHackathons({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  
  const { data: hackathons } = await supabase.from('hackathons').select('*').eq('org_id', org_id).order('created_at', { ascending: false })

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Hackathons</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">Active Hackathons</h2>
          {hackathons?.length === 0 ? (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No hackathons created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {hackathons?.map((h) => (
                <div key={h.id} className="surface-card p-5 relative group">
                  <div className="absolute top-4 right-4">
                    <HackathonStatusToggle orgId={org_id} hackathonId={h.id} initialStatus={h.status} />
                  </div>
                  <div className="flex justify-between items-start mb-2 pr-24">
                    <a href={`/admin/orgs/${org_id}/hackathons/${h.id}`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">{h.title}</a>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-2">{h.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2.5 py-1 bg-surface-soft text-text-muted rounded-full font-medium border border-line">
                      Team Size: {h.min_team_size} - {h.max_team_size}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-surface-soft text-text-muted rounded-full font-medium border border-line">
                      Due: {formatDateTime(h.due_at)}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-line text-xs text-text-muted flex items-center gap-3">
                    <span className="font-semibold uppercase tracking-wider">Required Links:</span>
                    {h.require_github && <span className="text-accent bg-orange-50 px-2 py-0.5 rounded">GitHub</span>}
                    {h.require_video && <span className="text-accent bg-orange-50 px-2 py-0.5 rounded">Video</span>}
                    {h.require_app_link && <span className="text-accent bg-orange-50 px-2 py-0.5 rounded">App Link</span>}
                    {h.require_drive_link && <span className="text-accent bg-orange-50 px-2 py-0.5 rounded">Drive</span>}
                    {!(h.require_github || h.require_video || h.require_app_link || h.require_drive_link) && <span>None</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <CreateHackathonForm orgId={org_id} />
        </div>
      </div>
    </div>
  )
}
