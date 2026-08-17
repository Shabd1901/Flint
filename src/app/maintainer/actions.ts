'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteOrgAsMaintainer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'maintainer') return

  const id = formData.get('id') as string
  if (!id) return

  await supabase.from('orgs').delete().eq('id', id)
  revalidatePath('/maintainer')
}

export async function unlinkAdminAsMaintainer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'maintainer') return

  const id = formData.get('id') as string
  if (!id) return

  // Note: This requires admin_id to be nullable in the database
  await supabase.from('orgs').update({ admin_id: null }).eq('id', id)
  revalidatePath('/maintainer')
}
