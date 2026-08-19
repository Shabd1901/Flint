import Link from 'next/link'
import { ArrowLeft, Code2 } from 'lucide-react'

export function TbdNotice({
  title,
  description,
  backHref,
  backLabel,
}: {
  title?: string
  description?: string
  backHref: string
  backLabel?: string
}) {
  return (
    <div className="container-page py-16 md:py-24 flex flex-col items-center justify-center text-center">
      <div className="surface-card p-8 md:p-12 max-w-lg w-full flex flex-col items-center text-center space-y-6 shadow-sm border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="p-4 rounded-full bg-amber-100/80 text-amber-700 border border-amber-200">
          <Code2 size={40} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold uppercase tracking-wider">
            TBD — Planned for Version 2
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {title || 'Coding Contests Module'}
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            {description || 'This feature is currently under active planning for Version 2. All backend code, data schemas, proctoring handlers, and submission pipelines have been preserved.'}
          </p>
        </div>

        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg bg-surface-soft border border-line px-5 py-2.5 text-sm font-semibold text-text hover:bg-line transition"
        >
          <ArrowLeft size={16} />
          {backLabel || 'Return to Classroom'}
        </Link>
      </div>
    </div>
  )
}
