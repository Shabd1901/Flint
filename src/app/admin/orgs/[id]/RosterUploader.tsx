'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { bulkInviteCandidates } from '../actions'

export function RosterUploader({ orgId }: { orgId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        // Extract emails (assuming one email per line, or simple CSV where first column is email)
        const emails = text
          .split('\n')
          .map(line => line.split(',')[0].trim()) // take first column
          .filter(email => email.includes('@')) // basic email validation

        if (emails.length === 0) {
          setError('No valid emails found in CSV.')
          return
        }

        startTransition(async () => {
          await bulkInviteCandidates(orgId, emails)
          if (fileInputRef.current) fileInputRef.current.value = ''
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input 
        type="file" 
        accept=".csv,.txt" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition disabled:opacity-70"
        title="Upload a CSV with emails in the first column"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {isPending ? 'Inviting...' : 'Bulk Import Roster'}
      </button>
      {error && <p className="text-rose-500 text-xs font-semibold">{error}</p>}
    </div>
  )
}
