import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'

export default async function AdminAssignments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: org } = await supabase.from('orgs').select('id').eq('admin_id', user!.id).single()
  const { data: assignments } = org ? await supabase.from('assignments').select('*').eq('org_id', org.id).order('created_at', { ascending: false }) : { data: [] }

  async function createAssignment(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    const { data: o } = await s.from('orgs').select('id').eq('admin_id', user!.id).single()
    
    await s.from('assignments').insert({
      org_id: o!.id,
      title: formData.get('title'),
      instructions: formData.get('instructions'),
      due_at: formData.get('due_at'),
      max_score: Number(formData.get('max_score'))
    })
    revalidatePath('/admin/assignments')
  }

  if (!org) {
    return <div className="container-page py-8 text-text-muted">Please create an organization first on the dashboard.</div>
  }

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
                    <a href={`/admin/assignments/${a.id}`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">{a.title}</a>
                    <span className="text-sm px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-medium">Max Score: {a.max_score}</span>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-2">{a.instructions}</p>
                  <div className="mt-4 text-xs text-text-muted flex items-center gap-4">
                    <span suppressHydrationWarning>Due: {formatDateTime(a.due_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form action={createAssignment} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Create New</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
              <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. React Frontend Task" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Instructions</label>
              <textarea name="instructions" required rows={4} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" placeholder="Provide GitHub template or task details..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Due Date</label>
              <input type="datetime-local" name="due_at" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Max Score</label>
              <input type="number" name="max_score" required min="1" max="100" defaultValue="100" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
              Publish Assignment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
