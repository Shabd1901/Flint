import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'

export default async function AdminContests({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contests } = await supabase.from('contests').select('*').eq('org_id', org_id).order('created_at', { ascending: false }) 

  async function createContest(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()

    await s.from('contests').insert({
      org_id: org_id,
      title: formData.get('title'),
      duration_minutes: Number(formData.get('duration_minutes')),
      start_at: formData.get('start_at') || null,
      end_at: formData.get('end_at') || null,
      status: 'draft'
    })

    revalidatePath(`/admin/orgs/${org_id}/contests`)
  }



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
              No coding contests created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {contests?.map((c: any) => (
                <div key={c.id} className="surface-card hover-lift p-5">
                  <div className="flex justify-between items-start mb-2">
                    <a href={`/admin/orgs/${org_id}/contests/${c.id}/problems`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">{c.title}</a>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider ${
                      c.status === 'live' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'closed' ? 'bg-rose-100 text-rose-700' :
                      'bg-surface-soft text-text-muted'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-text-muted flex justify-between items-center">
                    <div className="flex gap-4">
                      <span>Duration: {c.duration_minutes}m</span>
                      <span suppressHydrationWarning>Starts: {c.start_at ? formatDateTime(c.start_at) : 'Anytime'}</span>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/admin/orgs/${org_id}/contests/${c.id}/problems`} className="px-2.5 py-1 bg-surface-soft rounded text-text font-medium hover:bg-line transition">
                        Problems
                      </a>
                      <a href={`/admin/orgs/${org_id}/contests/${c.id}/results`} className="px-2.5 py-1 bg-accent/10 text-accent rounded font-medium hover:bg-accent/20 transition">
                        Results & Leaderboard
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form action={createContest} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Create Coding Contest</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Contest Title</label>
              <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Hackathon Screening Round 2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Duration (mins)</label>
              <input type="number" name="duration_minutes" required defaultValue="90" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Start Window (Opt)</label>
              <input type="datetime-local" name="start_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">End Window (Opt)</label>
              <input type="datetime-local" name="end_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
              Create Draft Contest
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
