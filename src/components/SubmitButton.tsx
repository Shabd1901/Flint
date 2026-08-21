'use client'

import { useFormStatus } from 'react-dom'
import { RefreshCw } from 'lucide-react'

interface SubmitButtonProps {
  children: React.ReactNode
  loadingText?: string
  className?: string
  icon?: React.ReactNode
}

export function SubmitButton({
  children,
  loadingText = 'Creating...',
  className = "w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4 flex items-center justify-center gap-2",
  icon
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:opacity-50 disabled:pointer-events-none`}
    >
      {pending ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}
