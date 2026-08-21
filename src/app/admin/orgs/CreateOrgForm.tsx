'use client'

import { useFormStatus } from 'react-dom'
import { createOrg } from './actions'
import { RefreshCw } from 'lucide-react'
import { useRef } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      disabled={pending}
      className="h-10 rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
    >
      {pending ? <RefreshCw size={16} className="animate-spin" /> : '+ Create'}
    </button>
  )
}

export function CreateOrgForm() {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <form 
      ref={ref}
      action={async (formData) => {
        await createOrg(formData)
        ref.current?.reset()
      }} 
      className="flex items-end gap-2"
    >
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">New Classroom</label>
        <input 
          name="name" 
          required 
          className="h-10 w-56 rounded-md border bg-white px-3 text-sm outline-none ring-accent focus:ring-2" 
          placeholder="e.g. Data Structures" 
        />
      </div>
      <SubmitButton />
    </form>
  )
}
