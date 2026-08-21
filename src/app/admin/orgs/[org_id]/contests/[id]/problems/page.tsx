import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddProblemForm } from './AddProblemForm'
import { ContestStatusToggle } from './ContestStatusToggle'

export default async function ContestProblems({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
  const supabase = await createClient()

  const { data: contest } = await supabase.from('contests').select('*').eq('id', id).single()
  const { data: problems } = await supabase
    .from('problems')
    .select('*, test_cases(*)')
    .eq('contest_id', id)

  if (!contest) return <div>Contest not found</div>

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/orgs/${org_id}/contests`} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contest.title} - Problems</h1>
          <p className="text-sm text-text-muted mt-1">Manage problems and test cases for this contest.</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
        <div className="text-sm">
          <span className="text-text-muted">Current Status: </span>
          <strong className="capitalize">{contest.status}</strong>
        </div>
        <ContestStatusToggle orgId={org_id} contestId={id} initialStatus={contest.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">Existing Problems ({problems?.length || 0})</h2>
          {problems?.length === 0 ? (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No problems added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {problems?.map((p) => (
                <div key={p.id} className="surface-card p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-text">{p.title}</h3>
                    <span className="text-xs px-2.5 py-1 bg-surface-soft text-text-muted rounded-full font-medium">
                      {(p.test_cases as any[])?.length || 0} Test Cases
                    </span>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-3 whitespace-pre-wrap">{p.description}</p>
                  <div className="mt-4 pt-4 border-t border-line flex gap-2">
                    {p.languages?.map((l: string) => (
                      <span key={l} className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <AddProblemForm orgId={org_id} contestId={id} />
        </div>
      </div>
    </div>
  )
}
