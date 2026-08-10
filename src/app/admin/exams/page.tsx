import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function AdminExams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: org } = await supabase.from('orgs').select('id').eq('admin_id', user!.id).single()
  const { data: exams } = org ? await supabase.from('exams').select('*').eq('org_id', org.id).order('created_at', { ascending: false }) : { data: [] }

  async function createExam(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    const { data: o } = await s.from('orgs').select('id').eq('admin_id', user!.id).single()
    
    await s.from('exams').insert({
      org_id: o!.id,
      title: formData.get('title'),
      description: formData.get('description'),
      duration_minutes: Number(formData.get('duration_minutes')),
      start_time: formData.get('start_time') || null,
      end_time: formData.get('end_time') || null,
      status: 'draft'
    })
    revalidatePath('/admin/exams')
  }

  if (!org) {
    return <div className="p-8 text-zinc-400">Please create an organization first on the dashboard.</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Manage Exams</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-zinc-300">All Exams</h2>
          {exams?.length === 0 ? (
            <div className="p-8 border border-zinc-800 border-dashed rounded-xl text-center text-zinc-500">
              No exams created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {exams?.map((exam) => (
                <div key={exam.id} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <a href={`/admin/exams/${exam.id}`} className="font-semibold text-lg text-blue-400 hover:underline">{exam.title}</a>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider ${
                      exam.status === 'live' ? 'bg-green-500/10 text-green-400' :
                      exam.status === 'closed' ? 'bg-red-500/10 text-red-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">{exam.description}</p>
                  <div className="mt-4 text-xs text-zinc-500 flex gap-4">
                    <span>Duration: {exam.duration_minutes}m</span>
                    <span>Starts: {exam.start_time ? new Date(exam.start_time).toLocaleString() : 'Anytime'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form action={createExam} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 sticky top-8">
            <h2 className="text-lg font-medium text-white mb-4">Create New Exam</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input name="title" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Midterm Assessment" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors resize-none" placeholder="..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Duration (mins)</label>
              <input type="number" name="duration_minutes" required defaultValue="60" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Start Time (Opt)</label>
              <input type="datetime-local" name="start_time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">End Time (Opt)</label>
              <input type="datetime-local" name="end_time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" />
            </div>

            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors mt-4">
              Create Draft
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
