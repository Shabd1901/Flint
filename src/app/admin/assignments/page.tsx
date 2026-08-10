import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
    return <div className="p-8 text-zinc-400">Please create an organization first on the dashboard.</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Manage Assignments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-zinc-300">Active Assignments</h2>
          {assignments?.length === 0 ? (
            <div className="p-8 border border-zinc-800 border-dashed rounded-xl text-center text-zinc-500">
              No assignments created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {assignments?.map((a) => (
                <div key={a.id} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <a href={`/admin/assignments/${a.id}`} className="font-semibold text-lg text-blue-400 hover:underline">{a.title}</a>
                    <span className="text-sm px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-medium">Max Score: {a.max_score}</span>
                  </div>
                  <p className="text-zinc-400 text-sm line-clamp-2">{a.instructions}</p>
                  <div className="mt-4 text-xs text-zinc-500 flex items-center gap-4">
                    <span>Due: {new Date(a.due_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form action={createAssignment} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 sticky top-8">
            <h2 className="text-lg font-medium text-white mb-4">Create New</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input name="title" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="e.g. React Frontend Task" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Instructions</label>
              <textarea name="instructions" required rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors resize-none" placeholder="Provide GitHub template or task details..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Due Date</label>
              <input type="datetime-local" name="due_at" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Max Score</label>
              <input type="number" name="max_score" required min="1" max="100" defaultValue="100" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" />
            </div>

            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors mt-4">
              Publish Assignment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
