import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/AdminSidebar'
import { UserProfileHeader } from '@/components/UserProfileHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, role')
    .eq('id', user.id)
    .single()

  const userProfile = {
    name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
    email: profile?.email || user.email || '',
    role: profile?.role || 'admin',
    tp_uid: profile?.tp_uid || user.user_metadata?.tp_uid || null
  }

  async function handleSignOut() {
    'use server'
    const s = await createClient()
    await s.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="h-[100dvh] bg-bg text-text flex flex-col md:flex-row overflow-hidden">
      <AdminSidebar signOutAction={handleSignOut} />
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md px-6 py-3 border-b border-line flex items-center justify-end">
          <UserProfileHeader profile={userProfile} signOutAction={handleSignOut} />
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
