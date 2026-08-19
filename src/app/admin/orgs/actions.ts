'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createOrg(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name = formData.get('name') as string
  if (!name) return

  await supabase.from('orgs').insert({
    admin_id: user.id,
    name
  })

  revalidatePath('/admin/orgs')
}

export async function updateOrg(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  if (!id || !name) return

  await supabase.from('orgs').update({ name }).eq('id', id)
  revalidatePath('/admin/orgs')
}

export async function deleteOrg(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return { error: 'Org ID is required' }

  const { error } = await supabase.from('orgs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orgs')
  return { success: true }
}

export async function addCoAdminAction(formData: FormData) {
  const supabase = await createClient()
  const orgId = formData.get('orgId') as string
  const email = (formData.get('email') as string)?.trim()
  
  if (!orgId || !email) return { error: 'Organization ID and Admin Email are required.' }

  // Lookup the user by email using Admin Client to bypass RLS (admins can't read other admins' profiles)
  const adminClient = createAdminClient()
  const { data: profiles, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('email', email)
  
  if (profileError || !profiles || profiles.length === 0) {
    return { error: 'No user found with that email address.' }
  }

  const profile = profiles[0]
  if (profile.role !== 'admin') {
    return { error: 'The specified user is not an Admin.' }
  }

  const { error } = await supabase.from('org_admins').insert({
    org_id: orgId,
    admin_id: profile.id
  })

  if (error) {
    // Unique violation constraint code
    if (error.code === '23505') {
      return { error: 'This user is already a co-admin for this organization.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/orgs')
  return { success: 'Co-admin added successfully!' }
}

export async function removeCoAdminAction(formData: FormData) {
  const supabase = await createClient()
  const orgId = formData.get('orgId') as string
  const adminId = formData.get('adminId') as string
  
  if (!orgId || !adminId) return { error: 'Organization ID and Admin ID are required.' }

  const { error } = await supabase
    .from('org_admins')
    .delete()
    .match({ org_id: orgId, admin_id: adminId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/orgs')
  return { success: 'Co-admin removed successfully.' }
}
