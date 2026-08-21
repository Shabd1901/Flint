import Link from 'next/link'
import { register } from './actions'
import { User, Mail, IdCard, Lock } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-accent">Flint</Link>
          <Link href="/login" className="rounded-md border bg-white px-4 py-2 text-xs font-semibold text-text hover:bg-surface-soft transition">
            Already registered? Sign in
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <section className="surface-card p-6 md:p-8 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Candidate Onboarding</p>
            <h1 className="text-3xl font-bold tracking-tight text-text">Create Candidate Profile</h1>
            <p className="text-sm text-text-muted leading-relaxed">
              Register your TCET candidate account using your institution email and T&amp;P UID.
            </p>

            <div className="rounded-xl border bg-surface-soft p-4 text-xs text-text-muted space-y-2 border-line">
              <p className="font-bold text-text text-sm">T&amp;P UID Format Rule:</p>
              <p className="leading-relaxed">
                T&amp;P UID must follow the <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold text-accent">YY-DEPT+ROLL-YY</code> format separated by hyphens.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Example 1: <code className="font-mono bg-white px-1 rounded">24-ITB01-28</code></li>
                <li>Example 2: <code className="font-mono bg-white px-1 rounded">24-AIDS44-28</code></li>
                <li>Example 3: <code className="font-mono bg-white px-1 rounded">23-IT01-27</code></li>
              </ul>
            </div>
          </section>

          <section className="surface-card p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text">Registration Form</h2>
              <p className="mt-1 text-xs text-text-muted">Fill out your candidate details below.</p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 animate-in fade-in">
                {error}
              </div>
            )}

            <form action={register} className="space-y-4">
              <label className="grid gap-1 text-xs font-semibold text-text-muted">
                <span>Full Name</span>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
                    placeholder="e.g. Dev Shah"
                  />
                </div>
              </label>

              <label className="grid gap-1 text-xs font-semibold text-text-muted">
                <span>TCET Email</span>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
                    placeholder="1032240000@tcetmumbai.in"
                  />
                </div>
              </label>

              <label className="grid gap-1 text-xs font-semibold text-text-muted">
                <span>T&amp;P UID</span>
                <div className="relative">
                  <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="tp_uid"
                    type="text"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-xs font-mono uppercase outline-none ring-accent focus:ring-2 text-text"
                    placeholder="e.g. 24-ITB01-28"
                  />
                </div>
              </label>

              <label className="grid gap-1 text-xs font-semibold text-text-muted">
                <span>Password</span>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <SubmitButton
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong shadow-md"
              >
                Create Candidate Account
              </SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
