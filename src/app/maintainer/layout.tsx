import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MaintainerSidebar } from '@/components/MaintainerSidebar'

export default async function MaintainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function handleSignOut() {
    'use server'
    const s = await createClient()
    await s.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-white">
      <MaintainerSidebar signOutAction={handleSignOut} />
      <main className="flex-1 overflow-auto bg-zinc-950">
        {children}
      </main>
    </div>
  )
}
