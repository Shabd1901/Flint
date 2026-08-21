'use client'

import { useRef, useTransition } from 'react'
import { createAssignmentAction } from './actions'
import { toast } from 'react-hot-toast'

export function CreateAssignmentForm({ orgId }: { orgId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createAssignmentAction(orgId, formData)
        if (result?.error) {
          toast.error(result.error)
        } else if (result?.success) {
          formRef.current?.reset()
          toast.success('Assignment published!')
        }
      } catch (e: any) {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="surface-card p-5 space-y-4 sticky top-8">
      <h2 className="text-lg font-semibold mb-4">Create New</h2>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
        <input name="title" required disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" placeholder="e.g. React Frontend Task" />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Instructions</label>
        <textarea name="instructions" required disabled={isPending} rows={4} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-none disabled:opacity-50" placeholder="Provide GitHub template or task details..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Due Date</label>
        <input type="datetime-local" name="due_at" required disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">Allowed Submission Formats</label>
        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80">
            <input type="checkbox" name="submission_types" value="file" defaultChecked disabled={isPending} className="w-4 h-4 text-accent border-line rounded focus:ring-accent disabled:opacity-50" /> File Upload
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80">
            <input type="checkbox" name="submission_types" value="link" defaultChecked disabled={isPending} className="w-4 h-4 text-accent border-line rounded focus:ring-accent disabled:opacity-50" /> URL Link
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80">
            <input type="checkbox" name="submission_types" value="text" defaultChecked disabled={isPending} className="w-4 h-4 text-accent border-line rounded focus:ring-accent disabled:opacity-50" /> Typed Text
          </label>
        </div>
      </div>

      <div className="p-3.5 bg-surface-soft rounded-xl border border-line space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text uppercase tracking-wider">
            Allowed Document Types (File Upload)
          </label>
          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            No ZIP Files
          </span>
        </div>
        <p className="text-[11px] text-text-muted leading-tight">
          Select document formats candidates can upload (Max ceiling: 10MB per file).
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
            <input type="checkbox" name="allowed_file_types" value="pdf" defaultChecked disabled={isPending} className="accent-accent disabled:opacity-50" />
            <span>PDF (<code className="text-[10px]">.pdf</code>)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
            <input type="checkbox" name="allowed_file_types" value="csv" defaultChecked disabled={isPending} className="accent-accent disabled:opacity-50" />
            <span>CSV (<code className="text-[10px]">.csv</code>)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
            <input type="checkbox" name="allowed_file_types" value="doc" defaultChecked disabled={isPending} className="accent-accent disabled:opacity-50" />
            <span>Word (<code className="text-[10px]">.doc, .docx</code>)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
            <input type="checkbox" name="allowed_file_types" value="md" defaultChecked disabled={isPending} className="accent-accent disabled:opacity-50" />
            <span>Markdown (<code className="text-[10px]">.md</code>)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 col-span-2">
            <input type="checkbox" name="allowed_file_types" value="xlsx" defaultChecked disabled={isPending} className="accent-accent disabled:opacity-50" />
            <span>Excel (<code className="text-[10px]">.xlsx, .xls</code>)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Max Score</label>
        <input type="number" name="max_score" required min="1" max="100" defaultValue="100" disabled={isPending} className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm disabled:opacity-50" />
      </div>

      <button disabled={isPending} className="w-full flex justify-center items-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
        {isPending ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Publish Assignment'
        )}
      </button>
    </form>
  )
}
