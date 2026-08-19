'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const name = (formData.get('name') as string || '').trim()
    const tpUid = (formData.get('tp_uid') as string || '').trim().toUpperCase()

    if (!name) {
      return { error: 'Full name cannot be empty.' }
    }

    // Validate T&P UID format if supplied
    if (tpUid) {
      const tpUidPattern = /^\d{2}-[A-Za-z0-9]+-\d{2}$/
      if (!tpUidPattern.test(tpUid)) {
        return { error: 'Invalid T&P UID format. Format must be YY-DEPT+ROLL-YY (e.g., 24-ITB01-28 or 24-AIDS44-28).' }
      }
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Update profiles table
    const updatePayload: any = { name }
    if (tpUid) updatePayload.tp_uid = tpUid

    const { error: dbErr } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)

    if (dbErr) {
      if (dbErr.message.includes('tp_uid')) {
        delete updatePayload.tp_uid
        await adminClient.from('profiles').update(updatePayload).eq('id', user.id)
      } else {
        return { error: 'Failed to update profile: ' + dbErr.message }
      }
    }

    // 2. Update Auth User Metadata globally
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        name,
        ...(tpUid ? { tp_uid: tpUid } : {})
      }
    })

    // 3. Revalidate all routes globally across all RBAC
    revalidatePath('/', 'layout')
    revalidatePath('/candidate')
    revalidatePath('/admin')
    revalidatePath('/maintainer')
    revalidatePath('/maintainer/candidates')

    return { success: 'Profile updated successfully globally!' }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while updating profile.' }
  }
}
