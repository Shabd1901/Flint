'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export async function register(formData: FormData) {
  const name = (formData.get('name') as string || '').trim()
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const tpUid = (formData.get('tp_uid') as string || '').trim().toUpperCase()
  const password = formData.get('password') as string

  if (!name || !email || !tpUid || !password) {
    redirect(`/register?error=${encodeURIComponent('All fields (Full Name, TCET Email, T&P UID, Password) are required.')}`)
  }

  // Validate T&P UID format: YY-DEPT+ROLL-YY (e.g., 24-ITB44-28 or 24-AIDS12-28)
  const tpUidPattern = /^\d{2}-[A-Za-z0-9]+-\d{2}$/
  if (!tpUidPattern.test(tpUid)) {
    redirect(`/register?error=${encodeURIComponent('Invalid T&P UID format. Must follow YY-DEPT+ROLL-YY format using hyphens (e.g., 24-ITB44-28 or 24-AIDS12-28).')}`)
  }

  // Use service role client to securely create the user and their candidate profile
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      tp_uid: tpUid
    }
  })

  let targetUserId = user?.id

  if (authError) {
    if (authError.message.toLowerCase().includes('already') || authError.code === 'email_exists') {
      redirect(`/register?error=${encodeURIComponent('An account with this email already exists. Please log in.')}`)
    } else {
      redirect(`/register?error=${encodeURIComponent(authError.message || 'Error creating account')}`)
    }
  }

  if (targetUserId) {
    const profilePayload: any = {
      id: targetUserId,
      role: 'candidate',
      name,
      email,
      tp_uid: tpUid
    }

    const { error: profileError } = await adminClient.from('profiles').upsert(profilePayload)

    if (profileError) {
      if (profileError.message.includes('tp_uid')) {
        delete profilePayload.tp_uid
        await adminClient.from('profiles').upsert(profilePayload)
      } else {
        redirect(`/register?error=${encodeURIComponent('Error creating profile: ' + profileError.message)}`)
      }
    }
  }

  redirect('/login?success=' + encodeURIComponent('Candidate account created successfully! Please sign in.'))
}
