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
      // 1. Max ceiling limit check: 4 MB (4 * 1024 * 1024 bytes) to prevent Vercel Serverless Function 4.5MB limit crashes
      if (file.size > 4 * 1024 * 1024) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
        return { error: `File size (${sizeMb} MB) exceeds the maximum allowed ceiling limit of 4 MB.` }
      }

      const originalName = file.name || 'document'
      const fileExt = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() || '' : ''
      const forbiddenExts = ['zip', 'rar', '7z', 'tar', 'gz', 'iso', 'exe', 'bat', 'sh']

      if (forbiddenExts.includes(fileExt)) {
        return { error: 'ZIP and compressed archive files are not allowed. Please upload a standard document (PDF, CSV, Word, Markdown, or Excel).' }
      }

      const bucketName = 'assignment-submissions'
      const { data: buckets } = await adminClient.storage.listBuckets()
      const bucketExists = buckets?.some((b: any) => b.name === bucketName)
      if (!bucketExists) {
        await adminClient.storage.createBucket(bucketName, { public: true })
      }

      const filePath = `${user.id}/${assignmentId}_${Date.now()}.${fileExt || 'bin'}`

      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from(bucketName)
        .upload(filePath, file, {
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

    // Check for existing submission
    const { data: existingSub } = await adminClient
      .from('assignment_submissions')
      .select('id, file_url')
      .eq('assignment_id', assignmentId)
      .eq('candidate_id', user.id)
      .maybeSingle()

    if (!fileUrl && existingSub?.file_url) {
      fileUrl = existingSub.file_url
    }

    let dbErr = null

    if (existingSub) {
      const { error } = await adminClient
        .from('assignment_submissions')
        .update({
          link_url: linkUrl || null,
          file_url: fileUrl || null,
          text_answer: textAnswer || null
        })
        .eq('id', existingSub.id)
      dbErr = error
    } else {
      const { error } = await adminClient
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          candidate_id: user.id,
          link_url: linkUrl || null,
          file_url: fileUrl || null,
          text_answer: textAnswer || null
        })
      dbErr = error
    }

    if (dbErr) {
      console.error('DB Error:', dbErr)
      return { error: 'Failed to save submission: ' + dbErr.message }
    }

    revalidatePath(`/candidate/orgs/${orgId}/assignments`)
    return { success: 'Assignment submitted successfully!' }
  } catch (err: any) {
    console.error('Unhandled submission error:', err)
    return { error: err.message || 'An error occurred during submission.' }
  }
}
