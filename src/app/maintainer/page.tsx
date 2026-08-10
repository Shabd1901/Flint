import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function MaintainerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  
  if (profile?.role !== 'maintainer') {
    redirect('/')
  }

  // Fetch all global data for maintainer overview
  const { data: orgs } = await supabase.from('orgs').select('id, name, created_at, profiles(name, email)')
  const { data: exams } = await supabase.from('exams').select('id, title, status, orgs(name)')
  const { data: violations } = await supabase.from('violation_events').select('id, violation_type, created_at, exam_attempts(profiles(name), exams(title))')

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm shadow-xl">
            <h3 className="font-medium text-sm text-zinc-400">Total Organizations</h3>
            <p className="text-4xl font-bold mt-2 text-white">{orgs?.length || 0}</p>
          </div>
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm shadow-xl">
            <h3 className="font-medium text-sm text-zinc-400">Total Exams</h3>
            <p className="text-4xl font-bold mt-2 text-white">{exams?.length || 0}</p>
          </div>
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm shadow-xl">
            <h3 className="font-medium text-sm text-zinc-400">Integrity Violations</h3>
            <p className="text-4xl font-bold mt-2 text-red-500">{violations?.length || 0}</p>
          </div>
        </div>

        {/* Tables */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Organizations</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 font-medium text-zinc-400">Name</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Admin</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {orgs?.map((org: any) => (
                  <tr key={org.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{org.name}</td>
                    <td className="px-6 py-4 text-zinc-300">{org.profiles?.name} ({org.profiles?.email})</td>
                    <td className="px-6 py-4 text-zinc-400">{new Date(org.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!orgs || orgs.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No organizations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Recent Violations</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 font-medium text-zinc-400">Candidate</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Exam</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Violation Type</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {violations?.slice(0, 10).map((v: any) => (
                  <tr key={v.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-300">{v.exam_attempts?.profiles?.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{v.exam_attempts?.exams?.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md text-xs font-semibold uppercase tracking-wider">
                        {v.violation_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!violations || violations.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No violations recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
