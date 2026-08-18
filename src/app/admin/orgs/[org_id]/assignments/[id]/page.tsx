import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AssignmentDetails({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()
  
  const { data: assignment } = await supabase.from('assignments').select('*').eq('id', id).single()
  const { data: submissions } = await supabase.from('assignment_submissions').select('*, profiles(name, email)').eq('assignment_id', id)

  async function gradeSubmission(formData: FormData) {
    'use server'
    const s = await createClient()
    await s.from('assignment_submissions')
      .update({
        score: Number(formData.get('score')),
        feedback: formData.get('feedback')
      })
      .eq('id', formData.get('submission_id'))
    
    revalidatePath(`/admin/orgs/${org_id}/assignments/${id}`)
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <Link href={`/admin/orgs/${org_id}/assignments`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Assignments
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{assignment?.title}</h1>
        <p className="text-text-muted mt-1">Submissions Overview</p>
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-5 py-3 font-medium text-text-muted">Candidate</th>
              <th className="px-5 py-3 font-medium text-text-muted">Submission Link / File</th>
              <th className="px-5 py-3 font-medium text-text-muted">Submitted At</th>
              <th className="px-5 py-3 font-medium text-text-muted">Score & Feedback</th>
            </tr>
          </thead>
          <tbody>
            {submissions?.map((sub: any) => (
              <tr key={sub.id} className="border-b hover:bg-surface-soft/70 transition-colors">
                <td className="px-5 py-3 font-medium">
                  {sub.profiles?.name}
                  <div className="text-xs text-text-muted mt-0.5">{sub.profiles?.email}</div>
                </td>
                <td className="px-5 py-3 space-y-2">
                  {sub.link_url && (
                    <div>
                      <a href={sub.link_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-strong hover:underline block truncate max-w-xs">{sub.link_url}</a>
                    </div>
                  )}
                  {sub.file_url && (
                    <div>
                      <a href={sub.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs bg-surface-soft px-2 py-1 rounded text-text font-medium hover:bg-line">
                        Download Attachment
                      </a>
                    </div>
                  )}
                  {sub.text_answer && (
                    <div className="text-xs text-text-muted bg-surface-soft p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {sub.text_answer}
                    </div>
                  )}
                  {!sub.link_url && !sub.file_url && !sub.text_answer && <span className="text-text-muted text-xs">No attachment</span>}
                </td>
                <td className="px-5 py-3 text-text-muted" suppressHydrationWarning>{formatDateTime(sub.submitted_at)}</td>
                <td className="px-5 py-3">
                  {sub.score !== null ? (
                    <div>
                      <span className="font-semibold">{sub.score}</span> / {assignment?.max_score}
                      <p className="text-xs text-text-muted mt-1">{sub.feedback}</p>
                    </div>
                  ) : (
                    <form action={gradeSubmission} className="flex gap-2 items-start">
                      <input type="hidden" name="submission_id" value={sub.id} />
                      <input name="score" type="number" required max={assignment?.max_score} placeholder="Score" className="w-20 h-9 rounded-md border bg-white px-2 outline-none ring-accent focus:ring-2 text-sm" />
                      <input name="feedback" type="text" placeholder="Feedback (opt)" className="w-32 h-9 rounded-md border bg-white px-2 outline-none ring-accent focus:ring-2 text-sm" />
                      <button className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-strong transition">Grade</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!submissions || submissions.length === 0) && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-text-muted">No submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
