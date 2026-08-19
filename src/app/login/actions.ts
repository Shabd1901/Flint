'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Invalid credentials')
  }

  // Redirect based on role
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    let role = profile?.role

    if (!role) {
      // Auto-heal profile if it was lost during schema reset
      const adminClient = createAdminClient()
      const fallbackRole = 'candidate' // Secure default: never trust email strings for role escalation
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      
      await adminClient.from('profiles').upsert({
        id: user.id,
        role: fallbackRole,
        name: name,
        email: user.email || ''
      })
      role = fallbackRole
    }

    if (role === 'maintainer') redirect('/maintainer')
    if (role === 'admin') redirect('/admin')
    if (role === 'candidate') redirect('/candidate')
  }

  redirect('/candidate')
}
