'use client'

import { useRef, useTransition } from 'react'
import { addProblemAction } from './actions'
import { toast } from 'react-hot-toast'

export function AddProblemForm({ orgId, contestId }: { orgId: string, contestId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await addProblemAction(orgId, contestId, formData)
        if (result?.error) {
          toast.error(result.error)
        } else if (result?.success) {
          formRef.current?.reset()
          toast.success('Problem added!')
        }
      } catch (e: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="surface-card p-5 space-y-4">
      <h2 className="text-lg font-semibold mb-4">Add Problem</h2>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
        <input name="title" required disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" placeholder="e.g. Two Sum" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
        <textarea name="description" required rows={4} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-none disabled:opacity-50" placeholder="Explain the problem..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Input Format</label>
        <textarea name="input_format" required rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-none disabled:opacity-50" placeholder="e.g. The first line contains an integer N..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Output Format</label>
        <textarea name="output_format" required rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-none disabled:opacity-50" placeholder="e.g. Print a single integer denoting..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Constraints</label>
        <textarea name="constraints" required rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-none disabled:opacity-50" placeholder="e.g. 1 <= N <= 10^5" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Sample Input</label>
          <textarea name="sample_input" rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm font-mono disabled:opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Sample Output</label>
          <textarea name="sample_output" rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm font-mono disabled:opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Hidden Input (Evaluation)</label>
          <textarea name="hidden_input" rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm font-mono disabled:opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Hidden Output (Evaluation)</label>
          <textarea name="hidden_output" rows={2} disabled={isPending} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm font-mono disabled:opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Python Starter Code</label>
          <textarea name="starter_python" rows={4} disabled={isPending} defaultValue="def solution(input_str):&#10;    # Write code here&#10;    return input_str" className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm font-mono disabled:opacity-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">JavaScript Starter Code</label>
          <textarea name="starter_js" rows={4} disabled={isPending} defaultValue="function solution(inputStr) {&#10;    // Write code here&#10;    return inputStr;&#10;}" className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm font-mono disabled:opacity-50" />
        </div>
      </div>

      <button disabled={isPending} className="w-full flex justify-center items-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
        {isPending ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Add Problem'
        )}
      </button>

      <button 
        type="button"
        onClick={async () => {
           startTransition(async () => {
              const { seedProblemsAction } = await import('./actions')
              const result = await seedProblemsAction(orgId, contestId)
              if (result?.error) toast.error(result.error)
              else toast.success('2 Simple Questions Pre-made!')
           })
        }}
        disabled={isPending} 
        className="w-full flex justify-center items-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface-soft transition mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
        Premake 2 Simple Questions
      </button>
    </form>
  )
}
