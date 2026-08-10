import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const sections = [
  {
    title: 'Proctored MCQ Exams',
    items: [
      'Question bank creation with randomization and optional negative marking',
      'Server-authoritative countdown and auto-submit on expiry',
      'Scoreboards shown alongside violation signals for human review',
    ],
  },
  {
    title: 'Assignments',
    items: [
      'Instruction-driven posting with due dates and attachments',
      'File/link submissions with version history',
      'Manual grading with score and feedback',
    ],
  },
  {
    title: 'Coding Contests',
    items: [
      'Problem and test-case authoring with sample/hidden cases',
      'Judge0 sandbox execution (outside app server)',
      'Live leaderboard and submission telemetry',
    ],
  },
  {
    title: 'Role hierarchy and isolation',
    items: [
      'Maintainer, Admin, Candidate role boundaries',
      'Row-Level Security driven isolation across orgs',
      'Maintainer-only cross-org override paths',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Flint</Link>
          <div className="flex items-center gap-2">
            <Link href="/contact" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Contact</Link>
            <Link href="/login" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong">Sign in</Link>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Feature map</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Built for real screening operations</h1>
          <p className="mt-2 max-w-3xl text-text-muted">
            Flint combines exams, assignments, and contests in one control plane while preserving strict data boundaries and timing integrity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="surface-card hover-lift p-5">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-text-muted">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 surface-card p-5">
          <p className="text-sm text-text-muted">Need a walkthrough tailored to your institution or event scale?</p>
          <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
            Talk to the Flint team <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  )
}
