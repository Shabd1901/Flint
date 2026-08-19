import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CandidateAssignments({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verify enrollment
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('org_id', org_id).eq('candidate_id', user!.id).single()
  if (!enrollment) redirect('/candidate')

  // Find assignments for this org
  const { data: assignments } = await supabase.from('assignments').select('*, orgs(name)').eq('org_id', org_id)

  // Find my submissions
  const { data: submissions } = await supabase.from('assignment_submissions').select('*').eq('candidate_id', user!.id)
  const submissionMap = new Map(submissions?.map(s => [s.assignment_id, s]))

    async function submitAssignment(formData: FormData) {
      'use server'
      const s = await createClient()
      const { data: { user } } = await s.auth.getUser()
      if (!user) return
      
      const assignmentId = formData.get('assignment_id') as string
      const linkUrl = formData.get('github_url') as string
      const textAnswer = formData.get('text_answer') as string
      const file = formData.get('attachment') as File | null

      const { createClient: createSB } = await import('@supabase/supabase-js')
      const adminClient = createSB(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      let fileUrl: string | null = null

      if (file && file.size > 0) {
        const bucketName = 'assignment-submissions'
        const { data: buckets } = await adminClient.storage.listBuckets()
        const bucketExists = buckets?.some((b: any) => b.name === bucketName)
        if (!bucketExists) {
          await adminClient.storage.createBucket(bucketName, { public: true })
        }

        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/${assignmentId}_${Date.now()}.${fileExt}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          })

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = adminClient.storage.from(bucketName).getPublicUrl(filePath)
          fileUrl = publicUrlData.publicUrl
        }
      }

      // Preserve existing file_url if resubmitting without attaching a new file
      const { data: existingSub } = await adminClient
        .from('assignment_submissions')
        .select('file_url')
        .eq('assignment_id', assignmentId)
        .eq('candidate_id', user.id)
        .single()

      if (!fileUrl && existingSub?.file_url) {
        fileUrl = existingSub.file_url
      }

      await adminClient.from('assignment_submissions').upsert({
        assignment_id: assignmentId,
        candidate_id: user.id,
        link_url: linkUrl || null,
        file_url: fileUrl || null,
        text_answer: textAnswer || null
      }, { onConflict: 'assignment_id,candidate_id' })

      revalidatePath(`/candidate/orgs/${org_id}/assignments`)
    }

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
                    <form action={submitAssignment} className="space-y-3">
                      <input type="hidden" name="assignment_id" value={a.id} />
                      
                      {(!a.submission_types || a.submission_types.includes('text')) && (
                        <textarea 
                          name="text_answer" 
                          rows={4} 
                          placeholder="Type your submission here..." 
                          className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-y" 
                        />
                      )}
                      
                      {(!a.submission_types || a.submission_types.includes('link')) && (
                        <input name="github_url" type="url" placeholder="URL link (e.g. GitHub repo, Drive link)" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm" />
                      )}
                      
                      <div className="flex items-center gap-2">
                        {(!a.submission_types || a.submission_types.includes('file')) ? (
                          <input name="attachment" type="file" className="text-xs text-text-muted flex-1 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface-soft file:text-text hover:file:bg-line cursor-pointer" />
                        ) : (
                          <div className="flex-1"></div>
                        )}
                        <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition whitespace-nowrap">
                          Submit
                        </button>
                      </div>
                    </form>
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
