import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Flint Admin</h2>
        </div>
        <nav className="flex flex-col gap-3">
          <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">Overview</Link>
          <Link href="/admin/assignments" className="text-zinc-400 hover:text-white transition-colors">Assignments</Link>
          <Link href="/admin/candidates" className="text-zinc-400 hover:text-white transition-colors">Candidates</Link>
        </nav>
        <div className="mt-auto">
          <form action={async () => {
            'use server'
            const s = await createClient(); await s.auth.signOut(); redirect('/login')
          }}>
            <button className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg transition-colors">Sign Out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
