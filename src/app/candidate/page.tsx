import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CandidateDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
            <h3 className="font-semibold text-lg">Active Exams</h3>
            <p className="text-zinc-400 mt-2">You have no pending exams.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
