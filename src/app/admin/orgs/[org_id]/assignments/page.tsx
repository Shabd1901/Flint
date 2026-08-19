import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'

export default async function AdminAssignments({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: assignments } = await supabase.from('assignments').select('*').eq('org_id', org_id).order('created_at', { ascending: false })

  async function createAssignment(formData: FormData) {
    'use server'
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    const subTypesRaw = formData.getAll('submission_types').map(String)
    const submission_types = subTypesRaw.length > 0 ? subTypesRaw : ['file', 'link', 'text']

    const allowedTypesRaw = formData.getAll('allowed_file_types').map(String)
    const allowed_file_types = allowedTypesRaw.length > 0 ? allowedTypesRaw : ['pdf', 'csv', 'doc', 'md', 'xlsx']

    await sb.from('assignments').insert({
      org_id: org_id,
      title: formData.get('title'),
      instructions: formData.get('instructions'),
      due_at: formData.get('due_at'),
      max_score: Number(formData.get('max_score')),
      submission_types,
      allowed_file_types
    })
    revalidatePath(`/admin/orgs/${org_id}/assignments`)
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
          <form action={createAssignment} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Create New</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
              <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" placeholder="e.g. React Frontend Task" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Instructions</label>
              <textarea name="instructions" required rows={4} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-none" placeholder="Provide GitHub template or task details..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Due Date</label>
              <input type="datetime-local" name="due_at" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Allowed Submission Formats</label>
              <div className="flex gap-4 items-center flex-wrap">
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="submission_types" value="file" defaultChecked className="w-4 h-4 text-accent border-line rounded focus:ring-accent" /> File Upload
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="submission_types" value="link" defaultChecked className="w-4 h-4 text-accent border-line rounded focus:ring-accent" /> URL Link
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="submission_types" value="text" defaultChecked className="w-4 h-4 text-accent border-line rounded focus:ring-accent" /> Typed Text
                </label>
              </div>
            </div>

            <div className="p-3.5 bg-surface-soft rounded-xl border border-line space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text uppercase tracking-wider">
                  Allowed Document Types (File Upload)
                </label>
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  No ZIP Files
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-tight">
                Select document formats candidates can upload (Max ceiling: 10MB per file).
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="allowed_file_types" value="pdf" defaultChecked className="accent-accent" />
                  <span>PDF (<code className="text-[10px]">.pdf</code>)</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="allowed_file_types" value="csv" defaultChecked className="accent-accent" />
                  <span>CSV (<code className="text-[10px]">.csv</code>)</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="allowed_file_types" value="doc" defaultChecked className="accent-accent" />
                  <span>Word (<code className="text-[10px]">.doc, .docx</code>)</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                  <input type="checkbox" name="allowed_file_types" value="md" defaultChecked className="accent-accent" />
                  <span>Markdown (<code className="text-[10px]">.md</code>)</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 col-span-2">
                  <input type="checkbox" name="allowed_file_types" value="xlsx" defaultChecked className="accent-accent" />
                  <span>Excel (<code className="text-[10px]">.xlsx, .xls</code>)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Max Score</label>
              <input type="number" name="max_score" required min="1" max="100" defaultValue="100" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" />
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
