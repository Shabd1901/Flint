import Link from 'next/link'
import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error
  const success = resolvedParams?.success

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-accent-strong">Back to Home</Link>
          <Link href="/register" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Create candidate account</Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Sign in</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-3 text-sm text-text-muted">Access your role-specific portal and continue your workflows.</p>

            <div className="mt-6 space-y-3">
              <div className="surface-card bg-surface-soft p-3">
                <p className="text-xs font-medium text-text-muted">Maintainer</p>
                <p className="text-sm">Cross-org system visibility and interventions</p>
              </div>
              <div className="surface-card bg-surface-soft p-3">
                <p className="text-xs font-medium text-text-muted">Admin</p>
                <p className="text-sm">Manage exams, assignments, and candidate cohorts</p>
              </div>
              <div className="surface-card bg-surface-soft p-3">
                <p className="text-xs font-medium text-text-muted">Candidate</p>
                <p className="text-sm">Take tests, submit assignments, and view outcomes</p>
              </div>
            </div>
          </section>

          <section className="surface-card p-6 md:p-8">
            <h2 className="text-xl font-semibold tracking-tight">Account login</h2>
            <p className="mt-1 text-sm text-text-muted">Use your registered credentials.</p>

            {success && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form className="mt-5 space-y-4">
              <label className="grid gap-1 text-sm">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2"
                  placeholder="you@example.com"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  required
                  className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2"
                  placeholder="••••••••"
                />
              </label>

              <button formAction={login} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong">
                Sign in
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
