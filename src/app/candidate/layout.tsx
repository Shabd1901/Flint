import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CandidateSidebar } from '@/components/CandidateSidebar'

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function handleSignOut() {
    'use server'
    const s = await createClient()
    await s.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="h-[100dvh] bg-bg text-text flex flex-col md:flex-row overflow-hidden">
      <CandidateSidebar signOutAction={handleSignOut} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
