import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TbdNotice } from '@/components/TbdNotice'

export default async function ContestProblems({ params }: { params: Promise<{ org_id: string, id: string }> }) {
  const { org_id, id } = await params
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
    revalidatePath(`/admin/orgs/${org_id}/contests/${id}/problems`)
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

    revalidatePath(`/admin/orgs/${org_id}/contests/${id}/problems`)
  }

  return (
    <TbdNotice
      title="Contest Problems Manager"
      description="The Contest Problem Management page is tagged as TBD for Version 2 release. All problem builder logic and test case schema functions are intact."
      backHref={`/admin/orgs/${org_id}`}
      backLabel="Back to Classroom"
    />
  )
}
