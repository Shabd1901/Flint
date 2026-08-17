'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function checkMaintainer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'maintainer') throw new Error('Unauthorized: Maintainer access required')
  return user
}

export async function createAdminAction(formData: FormData) {
  try {
    await checkMaintainer()
    const name = (formData.get('name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    const password = (formData.get('password') as string)?.trim()

    if (!name || !email || !password) {
      return { error: 'All fields (Name, Email, Password) are required.' }
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters long.' }
    }

    const adminClient = createAdminClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError || !authData.user) {
      return { error: authError?.message || 'Failed to create user account' }
    }

    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authData.user.id,
      role: 'admin',
      name,
      email
    })

    if (profileError) {
      return { error: 'Auth user created, but failed to create profile: ' + profileError.message }
    }

    revalidatePath('/maintainer/admins')
    revalidatePath('/maintainer')
    return { success: `Admin account "${name}" created successfully!` }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while creating admin.' }
  }
}

export async function updateAdminPasswordAction(formData: FormData) {
  try {
    await checkMaintainer()
    const adminId = formData.get('adminId') as string
    const newPassword = (formData.get('newPassword') as string)?.trim()

    if (!adminId || !newPassword) {
      return { error: 'Admin ID and New Password are required.' }
    }
    if (newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters long.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(adminId, { password: newPassword })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/maintainer/admins')
    return { success: 'Password updated successfully!' }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while updating password.' }
  }
}

export async function deleteAdminAction(formData: FormData) {
  try {
    await checkMaintainer()
    const adminId = formData.get('adminId') as string

    if (!adminId) {
      return { error: 'Admin ID is required.' }
    }

    const adminClient = createAdminClient()

    // Delete user from auth (cascades to profiles and related records)
    const { error } = await adminClient.auth.admin.deleteUser(adminId)
    if (error) {
      return { error: error.message }
    }

    revalidatePath('/maintainer/admins')
    revalidatePath('/maintainer')
    return { success: 'Admin account deleted successfully.' }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while deleting admin.' }
  }
}

export async function assignOrgAdminAction(formData: FormData) {
  try {
    await checkMaintainer()
    const orgId = formData.get('orgId') as string
    const adminId = formData.get('adminId') as string

    if (!orgId || !adminId) {
      return { error: 'Organization ID and Admin ID are required.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('orgs').update({ admin_id: adminId }).eq('id', orgId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/maintainer/admins')
    revalidatePath('/maintainer')
    return { success: 'Organization admin assigned successfully!' }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while assigning organization.' }
  }
}

export async function createOrgForAdminAction(formData: FormData) {
  try {
    await checkMaintainer()
    const adminId = formData.get('adminId') as string
    const orgName = (formData.get('orgName') as string)?.trim()

    if (!adminId || !orgName) {
      return { error: 'Admin ID and Organization Name are required.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('orgs').insert({
      name: orgName,
      admin_id: adminId
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/maintainer/admins')
    revalidatePath('/maintainer')
    return { success: `Organization "${orgName}" created and assigned to admin.` }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while creating organization.' }
  }
}

export async function deleteOrgAction(formData: FormData) {
  try {
    await checkMaintainer()
    const orgId = formData.get('orgId') as string

    if (!orgId) {
      return { error: 'Organization ID is required.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('orgs').delete().eq('id', orgId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/maintainer/admins')
    revalidatePath('/maintainer')
    return { success: 'Organization deleted successfully.' }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while deleting organization.' }
  }
}

export async function unlinkAdminAction(formData: FormData) {
  try {
    await checkMaintainer()
    const orgId = formData.get('orgId') as string

    if (!orgId) {
      return { error: 'Organization ID is required.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('orgs').update({ admin_id: null }).eq('id', orgId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/maintainer/admins')
    revalidatePath('/maintainer')
    return { success: 'Admin unlinked from organization successfully.' }
  } catch (err: any) {
    return { error: err.message || 'An error occurred while unlinking admin.' }
  }
}
