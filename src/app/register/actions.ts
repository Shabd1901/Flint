'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Use service role client to securely create the user and their candidate profile
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true // auto confirm so they can login immediately
  })

  if (authError || !user) {
    redirect(`/register?error=${encodeURIComponent(authError?.message || 'Error creating account')}`)
  }

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: user.id,
    role: 'candidate',
    name,
    email
  })

  if (profileError) {
    redirect(`/register?error=${encodeURIComponent('Error creating profile: ' + profileError.message)}`)
  }

  redirect('/login?error=' + encodeURIComponent('Account created successfully! Please sign in.'))
}
