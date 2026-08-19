import Link from 'next/link'
import { LoginForm } from './LoginForm'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error
  const success = resolvedParams?.success

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            Back to Home
          </Link>
          <Link
            href="/register"
            className="rounded-md border bg-white px-4 py-2 text-xs font-semibold text-text hover:bg-surface-soft transition"
          >
            Register Candidate Account
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <section className="surface-card p-6 md:p-8 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Authentication Portal</p>
            <h1 className="text-3xl font-bold tracking-tight text-text">Welcome to Flint</h1>
            <p className="text-sm text-text-muted leading-relaxed">
              Sign in to your account to access your role-specific dashboard and manage your workspace.
            </p>

            <div className="space-y-3 pt-2">
              <div className="surface-card bg-surface-soft p-4 border border-line">
                <p className="text-xs font-bold text-accent">Candidate Portal</p>
                <p className="text-xs text-text-muted mt-1">Take proctored assessments, submit assignments, and view score analytics.</p>
              </div>
              <div className="surface-card bg-surface-soft p-4 border border-line">
                <p className="text-xs font-bold text-text">Admin & Instructor Portal</p>
                <p className="text-xs text-text-muted mt-1">Manage classrooms, create exams, review proctoring integrity logs, and grade submissions.</p>
              </div>
            </div>
          </section>

          <section>
            <LoginForm error={error} success={success} />
          </section>
        </div>
      </div>
    </div>
  )
}
