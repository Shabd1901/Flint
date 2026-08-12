import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'

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
      start_at: formData.get('start_at') || null,
      end_at: formData.get('end_at') || null,
      status: 'draft'
    })
    revalidatePath('/admin/exams')
  }

  if (!org) {
    return <div className="container-page py-8 text-text-muted">Please create an organization first on the dashboard.</div>
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Exams</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">All Exams</h2>
          {exams?.length === 0 ? (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No exams created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {exams?.map((exam) => (
                <div key={exam.id} className="surface-card hover-lift p-5">
                  <div className="flex justify-between items-start mb-2">
                    <a href={`/admin/exams/${exam.id}`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">{exam.title}</a>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider ${
                      exam.status === 'live' ? 'bg-emerald-100 text-emerald-700' :
                      exam.status === 'closed' ? 'bg-rose-100 text-rose-700' :
                      'bg-surface-soft text-text-muted'
                    }`}>
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">{exam.description}</p>
                  <div className="mt-4 text-xs text-text-muted flex gap-4">
                    <span>Duration: {exam.duration_minutes}m</span>
                    <span suppressHydrationWarning>Starts: {exam.start_at ? formatDateTime(exam.start_at) : 'Anytime'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form action={createExam} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Create New Exam</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
              <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Midterm Assessment" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" placeholder="..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Duration (mins)</label>
              <input type="number" name="duration_minutes" required defaultValue="60" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Start Time (Opt)</label>
              <input type="datetime-local" name="start_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">End Time (Opt)</label>
              <input type="datetime-local" name="end_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
              Create Draft
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

