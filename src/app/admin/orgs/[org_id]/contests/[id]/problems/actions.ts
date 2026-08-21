'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContestStatusAction(orgId: string, contestId: string, formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const status = formData.get('status')
  if (!status) return { error: 'Missing status' }

  const { error } = await sb.from('contests').update({ status }).eq('id', contestId)
  if (error) {
    console.error('[updateContestStatusAction] Error:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/orgs/${orgId}/contests/${contestId}/problems`)
  return { success: true }
}

export async function addProblemAction(orgId: string, contestId: string, formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const starterPy = formData.get('starter_python') as string
  const starterJs = formData.get('starter_js') as string

  const starterCode = {
    python: starterPy || 'def solution(input_str):\n    # Write code here\n    return input_str',
    javascript: starterJs || 'function solution(inputStr) {\n    // Write code here\n    return inputStr;\n}'
  }

  const { data: problem, error } = await sb.from('problems').insert({
    contest_id: contestId,
    title: formData.get('title'),
    statement: formData.get('statement'),
    starter_code: starterCode,
    languages: ['python', 'javascript']
  }).select().single()

  if (error || !problem) {
    console.error('[addProblemAction] Error:', error)
    return { error: error?.message || 'Failed to create problem' }
  }

  // Create sample test case
  const sampleInput = formData.get('sample_input') as string
  const sampleOutput = formData.get('sample_output') as string
  if (sampleInput && sampleOutput) {
    await sb.from('test_cases').insert({
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
    await sb.from('test_cases').insert({
      problem_id: problem.id,
      input: hiddenInput,
      expected_output: hiddenOutput,
      is_sample: false,
      weight: 2
    })
  }

  revalidatePath(`/admin/orgs/${orgId}/contests/${contestId}/problems`)
  return { success: true }
}
