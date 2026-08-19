'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteUserAction(userId: string) {
  const supabase = await createServerClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
  if (profile?.role !== 'maintainer') {
    return { error: 'Unauthorized. Only maintainers can delete accounts.' }
  }

  if (userId === currentUser.id) {
    return { error: 'You cannot delete your own maintainer account.' }
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Delete profile record
  await adminClient.from('profiles').delete().eq('id', userId)

  // 2. Delete Auth user account
  const { error: authErr } = await adminClient.auth.admin.deleteUser(userId)
  if (authErr) {
    return { error: 'Failed to delete user account: ' + authErr.message }
  }

  revalidatePath('/maintainer')
  revalidatePath('/maintainer/candidates')
  revalidatePath('/maintainer/admins')
  return { success: 'User deleted successfully.' }
}

export async function deleteOrgAsMaintainer(formData: FormData) {
  const orgId = formData.get('id') as string
  if (!orgId) return

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'maintainer') return

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await adminClient.from('orgs').delete().eq('id', orgId)
  revalidatePath('/maintainer')
}
