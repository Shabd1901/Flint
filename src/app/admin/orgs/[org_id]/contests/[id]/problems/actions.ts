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
    description: formData.get('description'),
    input_format: formData.get('input_format'),
    output_format: formData.get('output_format'),
    constraints: formData.get('constraints'),
    starter_code: starterCode,
    languages: ['python']
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

export async function seedProblemsAction(orgId: string, contestId: string) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  // Problem 1: Two Sum
  const { data: p1, error: e1 } = await sb.from('problems').insert({
    contest_id: contestId,
    title: 'Two Sum',
    description: 'Given a string containing two integers separated by a space, print their sum.',
    input_format: 'A single line containing two space-separated integers A and B.',
    output_format: 'Print a single integer which is the sum of A and B.',
    constraints: '1 <= A, B <= 1000',
    starter_code: { python: 'def solution(input_str):\n    # Write code here\n    pass' },
    languages: ['python']
  }).select().single()

  if (p1) {
    await sb.from('test_cases').insert([
      { problem_id: p1.id, input: '3 5', expected_output: '8', is_sample: true, weight: 1 },
      { problem_id: p1.id, input: '10 20', expected_output: '30', is_sample: false, weight: 2 }
    ])
  }

  // Problem 2: Reverse String
  const { data: p2, error: e2 } = await sb.from('problems').insert({
    contest_id: contestId,
    title: 'Reverse String',
    description: 'Write a program to reverse a given string.',
    input_format: 'A single string S.',
    output_format: 'Print the reversed string.',
    constraints: '1 <= |S| <= 1000',
    starter_code: { python: 'def solution(input_str):\n    # Write code here\n    pass' },
    languages: ['python']
  }).select().single()

  if (p2) {
    await sb.from('test_cases').insert([
      { problem_id: p2.id, input: 'hello', expected_output: 'olleh', is_sample: true, weight: 1 },
      { problem_id: p2.id, input: 'world', expected_output: 'dlrow', is_sample: false, weight: 2 }
    ])
  }

  revalidatePath(`/admin/orgs/${orgId}/contests/${contestId}/problems`)
  return { success: true }
}
