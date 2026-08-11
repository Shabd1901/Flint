import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function ContestProblems({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contest } = await supabase.from('contests').select('*').eq('id', id).single()
  const { data: problems } = await supabase
    .from('problems')
    .select('*, test_cases(*)')
    .eq('contest_id', id)

  async function updateContestStatus(formData: FormData) {
    'use server'
    const s = await createClient()
    await s.from('contests').update({ status: formData.get('status') }).eq('id', id)
    revalidatePath(`/admin/contests/${id}/problems`)
  }

  async function addProblem(formData: FormData) {
    'use server'
    const s = await createClient()
    
    const starterPy = formData.get('starter_python') as string
    const starterJs = formData.get('starter_js') as string

    const starterCode = {
      python: starterPy || 'def solution(input_str):\n    # Write code here\n    return input_str',
      javascript: starterJs || 'function solution(inputStr) {\n    // Write code here\n    return inputStr;\n}'
    }

    const { data: problem, error } = await s.from('problems').insert({
      contest_id: id,
      title: formData.get('title'),
      statement: formData.get('statement'),
      starter_code: starterCode,
      languages: ['python', 'javascript']
    }).select().single()

    if (!error && problem) {
      // Create sample test case
      const sampleInput = formData.get('sample_input') as string
      const sampleOutput = formData.get('sample_output') as string
      if (sampleInput && sampleOutput) {
        await s.from('test_cases').insert({
          problem_id: problem.id,
          input: sampleInput,
          expected_output: sampleOutput,
          is_sample: true,
          weight: 1
        })
      }

      // Create hidden test case
      const hiddenInput = formData.get('hidden_input') as string
      const hiddenOutput = formData.get('hidden_output') as string
      if (hiddenInput && hiddenOutput) {
        await s.from('test_cases').insert({
          problem_id: problem.id,
          input: hiddenInput,
          expected_output: hiddenOutput,
          is_sample: false,
          weight: 2
        })
      }
    }

    revalidatePath(`/admin/contests/${id}/problems`)
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contest?.title}</h1>
          <p className="text-text-muted mt-1">Manage Contest Problems & Test Cases</p>
        </div>

        <form action={updateContestStatus} className="flex gap-2 surface-card p-1.5">
          <select name="status" defaultValue={contest?.status} className="h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm">
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="closed">Closed</option>
          </select>
          <button className="rounded-md border bg-white px-4 py-1.5 text-sm font-medium hover:bg-surface-soft">Update Status</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">Problem Set ({problems?.length || 0})</h2>

          {problems?.map((p: any, i: number) => (
            <div key={p.id} className="surface-card p-5 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{i + 1}. {p.title}</h3>
                <span className="text-xs bg-surface-soft px-2 py-1 rounded font-mono text-text-muted">
                  {p.test_cases?.length || 0} Test Cases
                </span>
              </div>
              <p className="text-sm text-text-muted whitespace-pre-wrap">{p.statement}</p>

              <div className="pt-3 border-t text-xs space-y-2">
                <p className="font-medium text-text">Test Cases:</p>
                {p.test_cases?.map((tc: any) => (
                  <div key={tc.id} className="flex items-center justify-between bg-surface-soft p-2 rounded">
                    <span>In: <code className="font-mono">{tc.input}</code> → Out: <code className="font-mono">{tc.expected_output}</code></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${tc.is_sample ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {tc.is_sample ? 'Sample' : 'Hidden'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {(!problems || problems.length === 0) && (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No problems added to this contest yet.
            </div>
          )}
        </div>

        <div>
          <form action={addProblem} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Add Problem</h2>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Problem Title</label>
              <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Reverse String" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Problem Statement</label>
              <textarea name="statement" required rows={4} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" placeholder="Given a string S, print its reverse..." />
            </div>

            <div className="pt-2 border-t space-y-3">
              <p className="text-xs font-semibold text-text uppercase tracking-wider">Test Cases Setup</p>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Sample Test Case Input</label>
                <input name="sample_input" required className="w-full h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm font-mono" placeholder="hello" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Sample Expected Output</label>
                <input name="sample_output" required className="w-full h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm font-mono" placeholder="olleh" />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Hidden Test Case Input</label>
                <input name="hidden_input" required className="w-full h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm font-mono" placeholder="world" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Hidden Expected Output</label>
                <input name="hidden_output" required className="w-full h-9 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm font-mono" placeholder="dlrow" />
              </div>
            </div>

            <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
              Add Problem & Test Cases
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
