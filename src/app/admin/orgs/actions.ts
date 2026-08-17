'use server'

import { createClient } from '@/utils/supabase/server'
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
  if (!id) return

  await supabase.from('orgs').delete().eq('id', id)
  revalidatePath('/admin/orgs')
}
