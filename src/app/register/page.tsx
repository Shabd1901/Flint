import Link from 'next/link'
import { register } from './actions'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Flint</Link>
          <Link href="/login" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Already registered? Sign in</Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Candidate onboarding</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your candidate profile</h1>
            <p className="mt-3 text-sm text-text-muted">
              Register once and use the same account across exams, coding rounds, and assignments.
            </p>

            <div className="mt-6 rounded-lg border bg-surface-soft p-4 text-sm text-text-muted">
              <p className="font-medium text-text">What happens next?</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Account is created and email is confirmed.</li>
                <li>Your role is set to candidate.</li>
                <li>Sign in and join your class/event via invite code.</li>
              </ol>
            </div>
          </section>

          <section className="surface-card p-6 md:p-8">
            <h2 className="text-xl font-semibold tracking-tight">Registration form</h2>
            <p className="mt-1 text-sm text-text-muted">Only candidates can self-register in Phase 1.</p>

            {error && (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form className="mt-5 space-y-4">
              <label className="grid gap-1 text-sm">
                <span>Full name</span>
                <input
                  name="name"
                  type="text"
                  required
                  className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2"
                  placeholder="John Doe"
                />
              </label>

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
                  minLength={6}
                  className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2"
                  placeholder="••••••••"
                />
              </label>

              <button formAction={register} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong">
                Create account
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
