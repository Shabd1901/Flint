'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function submitAssignmentAction(orgId: string, formData: FormData) {
  try {
    const s = await createServerClient()
    const { data: { user } } = await s.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const assignmentId = formData.get('assignment_id') as string
    const linkUrl = formData.get('github_url') as string
    const textAnswer = formData.get('text_answer') as string
    const file = formData.get('attachment') as File | null

    if (!assignmentId) return { error: 'Invalid assignment.' }

    const adminClient = createClient(
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

      const originalName = file.name || 'document'
      const fileExt = originalName.includes('.') ? originalName.split('.').pop() : 'bin'
      const filePath = `${user.id}/${assignmentId}_${Date.now()}.${fileExt}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { error: 'Failed to upload attachment file: ' + uploadError.message }
      }

      if (uploadData) {
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

    const { error: dbErr } = await adminClient.from('assignment_submissions').upsert({
      assignment_id: assignmentId,
      candidate_id: user.id,
      link_url: linkUrl || null,
      file_url: fileUrl || null,
      text_answer: textAnswer || null
    }, { onConflict: 'assignment_id,candidate_id' })

    if (dbErr) {
      console.error('DB Upsert Error:', dbErr)
      return { error: 'Failed to save submission: ' + dbErr.message }
    }

    revalidatePath(`/candidate/orgs/${orgId}/assignments`)
    return { success: 'Assignment submitted successfully!' }
  } catch (err: any) {
    console.error('Unhandled submission error:', err)
    return { error: err.message || 'An error occurred during submission.' }
  }
}
