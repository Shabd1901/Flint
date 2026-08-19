'use client'

import { useState, useTransition } from 'react'
import { submitAssignmentAction } from './actions'
import { RefreshCw, AlertCircle, CheckCircle2, Upload } from 'lucide-react'

export function AssignmentSubmitForm({
  assignment,
  orgId
}: {
  assignment: any
  orgId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('attachment') as File | null

    // Client side file size check (50 MB limit)
    if (file && file.size > 50 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 50MB limit. Please upload a smaller file.')
      return
    }

    startTransition(async () => {
      const res = await submitAssignmentAction(orgId, formData)
      if (res?.error) {
        setErrorMsg(res.error)
      } else if (res?.success) {
        setSuccessMsg(res.success)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="assignment_id" value={assignment.id} />

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {(!assignment.submission_types || assignment.submission_types.includes('text')) && (
        <textarea
          name="text_answer"
          rows={4}
          placeholder="Type your submission here..."
          className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 text-sm resize-y"
        />
      )}

      {(!assignment.submission_types || assignment.submission_types.includes('link')) && (
        <input
          name="github_url"
          type="url"
          placeholder="URL link (e.g. GitHub repo, Drive link)"
          className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2 text-sm"
        />
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {(!assignment.submission_types || assignment.submission_types.includes('file')) ? (
          <div className="flex-1 min-w-[200px]">
            <label className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white cursor-pointer hover:bg-surface-soft transition text-xs text-text-muted">
              <Upload size={14} className="text-text-muted shrink-0" />
              <span className="truncate">{fileName || 'Choose document/file to attach...'}</span>
              <input
                name="attachment"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  setFileName(selected ? selected.name : '')
                }}
              />
            </label>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap"
        >
          {isPending ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Uploading & Submitting...
            </>
          ) : (
            'Submit Assignment'
          )}
        </button>
      </div>
    </form>
  )
}
