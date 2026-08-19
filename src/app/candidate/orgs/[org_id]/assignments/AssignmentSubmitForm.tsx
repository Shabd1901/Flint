'use client'

import { useState, useTransition } from 'react'
import { submitAssignmentAction } from './actions'
import { RefreshCw, AlertCircle, CheckCircle2, Upload } from 'lucide-react'

const FILE_FORMAT_MAP: Record<string, { extensions: string[]; accept: string; label: string }> = {
  pdf: { extensions: ['pdf'], accept: '.pdf,application/pdf', label: 'PDF' },
  csv: { extensions: ['csv'], accept: '.csv,text/csv', label: 'CSV' },
  doc: { extensions: ['doc', 'docx'], accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word' },
  md: { extensions: ['md', 'markdown'], accept: '.md,text/markdown,text/plain', label: 'Markdown' },
  xlsx: { extensions: ['xlsx', 'xls'], accept: '.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
}

const FORBIDDEN_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'iso', 'exe', 'bat', 'sh']

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

  // Determine allowed types
  const configuredTypes: string[] = Array.isArray(assignment.allowed_file_types) && assignment.allowed_file_types.length > 0
    ? assignment.allowed_file_types
    : ['pdf', 'csv', 'doc', 'md', 'xlsx']

  const allowedExtensions: string[] = []
  const acceptParts: string[] = []
  const allowedLabels: string[] = []

  configuredTypes.forEach((key) => {
    const fmt = FILE_FORMAT_MAP[key]
    if (fmt) {
      allowedExtensions.push(...fmt.extensions)
      acceptParts.push(fmt.accept)
      allowedLabels.push(fmt.label)
    }
  })

  const acceptAttribute = acceptParts.join(',')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('attachment') as File | null

    if (file && file.size > 0) {
      // 1. Check max 10MB ceiling
      if (file.size > 10 * 1024 * 1024) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
        setErrorMsg(`File size (${sizeMb} MB) exceeds the maximum allowed ceiling limit of 10 MB.`)
        return
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''

      // 2. Reject ZIP / archive files explicitly
      if (FORBIDDEN_EXTENSIONS.includes(fileExt)) {
        setErrorMsg('ZIP and archive files are strictly not allowed. Please upload a standard document (PDF, CSV, Word, Markdown, or Excel).')
        return
      }

      // 3. Check allowed extensions
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExt)) {
        setErrorMsg(`File format '.${fileExt}' is not allowed for this assignment. Allowed formats: ${allowedLabels.join(', ')}.`)
        return
      }
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

      {(!assignment.submission_types || assignment.submission_types.includes('file')) && (
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white cursor-pointer hover:bg-surface-soft transition text-xs text-text-muted">
                <Upload size={14} className="text-text-muted shrink-0" />
                <span className="truncate">{fileName || 'Choose document/file to attach...'}</span>
                <input
                  name="attachment"
                  type="file"
                  accept={acceptAttribute}
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0]
                    setFileName(selected ? selected.name : '')
                  }}
                />
              </label>
            </div>

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

          <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
            <span>Allowed: <strong className="text-text font-medium">{allowedLabels.join(', ')}</strong></span>
            <span>Max ceiling: <strong className="text-text font-medium">10 MB</strong> (No ZIP files)</span>
          </div>
        </div>
      )}
    </form>
  )
}
