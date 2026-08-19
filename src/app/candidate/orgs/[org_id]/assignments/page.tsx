import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AssignmentSubmitForm } from './AssignmentSubmitForm'

export default async function CandidateAssignments({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // Verify enrollment
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('org_id', org_id).eq('candidate_id', user.id).single()
  if (!enrollment) redirect('/candidate')

  // Find assignments for this org
  const { data: assignments } = await supabase.from('assignments').select('*, orgs(name)').eq('org_id', org_id)

  // Find my submissions
  const { data: submissions } = await supabase.from('assignment_submissions').select('*').eq('candidate_id', user.id)
  const submissionMap = new Map(submissions?.map(s => [s.assignment_id, s]))

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <Link href={`/candidate/orgs/${org_id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Classroom
      </Link>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">My Assignments</h1>
      </div>

      {assignments?.length === 0 ? (
        <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
          No assignments available. You need to be enrolled in an organization first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments?.map((a: any) => {
            const sub = submissionMap.get(a.id)
            const isSubmitted = !!sub
            const isLate = new Date() > new Date(a.due_at)

            return (
              <div key={a.id} className="surface-card p-5 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{a.title}</h3>
                    <p className="text-xs text-text-muted">{a.orgs?.name}</p>
                  </div>
                  {isSubmitted ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Submitted</span>
                  ) : isLate ? (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-semibold">Overdue</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-surface-soft text-text-muted rounded-md text-xs font-semibold">Pending</span>
                  )}
                </div>
                
                <p className="text-text-muted text-sm mt-3 flex-1 whitespace-pre-wrap">{a.instructions}</p>
                
                <div className="mt-5 pt-4 border-t">
                  <div className="flex justify-between items-center text-xs text-text-muted mb-3">
                    <span suppressHydrationWarning>Due: {formatDateTime(a.due_at)}</span>
                    <span>Max Score: {a.max_score}</span>
                  </div>
                  
                  {isSubmitted ? (
                    <div className="p-4 bg-surface-soft rounded-lg space-y-2">
                      <p className="text-sm flex justify-between">
                        <span className="text-text-muted">Score:</span> 
                        <span className="font-semibold">{sub.score !== null ? `${sub.score} / ${a.max_score}` : 'Pending Grading'}</span>
                      </p>
                      {sub.text_answer && (
                        <div className="mt-2 text-sm text-text-muted">
                          <span className="block font-medium mb-1 text-text">Text Submission:</span>
                          <div className="bg-white p-2 rounded border whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {sub.text_answer}
                          </div>
                        </div>
                      )}
                      {sub.link_url && (
                        <p className="text-xs text-text-muted truncate">
                          Link: <a href={sub.link_url} target="_blank" rel="noreferrer" className="text-accent underline">{sub.link_url}</a>
                        </p>
                      )}
                      {sub.file_url && (
                        <p className="text-xs text-text-muted truncate">
                          File: <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-accent underline">Download Attachment</a>
                        </p>
                      )}
                      {sub.feedback && (
                        <div className="mt-2 text-sm text-text-muted">
                          <span className="block font-medium mb-1">Feedback:</span>
                          {sub.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <AssignmentSubmitForm assignment={a} orgId={org_id} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
