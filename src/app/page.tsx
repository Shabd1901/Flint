import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'maintainer') redirect('/maintainer')
    if (profile?.role === 'admin') redirect('/admin')
    if (profile?.role === 'candidate') redirect('/candidate')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Flint</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          The next-generation secure technical assessment platform. Built for scale, designed for integrity.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-8">
          <a href="/login" className="px-8 py-4 bg-white text-zinc-950 rounded-full font-semibold hover:bg-zinc-200 transition-colors">
            Sign In
          </a>
          <a href="/register" className="px-8 py-4 bg-zinc-900 text-white rounded-full font-semibold border border-zinc-800 hover:bg-zinc-800 transition-colors">
            Join as Candidate
          </a>
        </div>
      </div>
    </div>
  )
}
