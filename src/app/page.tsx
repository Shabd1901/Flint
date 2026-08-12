import Link from 'next/link'
import { ArrowRight, ShieldCheck, CheckCircle2, Code2, ShieldAlert, FileText, Users, Trophy, Sparkles } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const integrityRows = [
  ['tab_switch', 'Switched browser tabs / window hidden', '+2 pts', 'Amber Flag'],
  ['blur', 'Window focus lost', '+1 pt', 'Amber Flag'],
  ['fullscreen_exit', 'Exited mandatory fullscreen mode', '+3 pts', 'Red Flag'],
  ['devtools', 'Opened browser developer tools / inspect element', '+3 pts', 'Red Flag'],
  ['multi_session', 'Concurrent login detected on second device', '+5 pts', 'Session Lockout'],
]

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'maintainer') redirect('/maintainer')
    if (profile?.role === 'admin') redirect('/admin')
    if (profile?.role === 'candidate') redirect('/candidate')
  }

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b bg-surface/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="h-3 w-3 rounded-full bg-accent animate-pulse" />
            Flint
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-text-muted md:flex">
            <Link className="hover:text-text transition-colors" href="/features">Features</Link>
            <Link className="hover:text-text transition-colors" href="/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-surface-soft transition shadow-sm">
              Sign In
            </Link>
            <Link href="/register" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition shadow-sm">
              Register Candidate
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-12 pb-16">
        {/* Hero Section */}
        <section className="container-page pt-12 md:pt-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-orange-50 px-4 py-1.5 text-xs font-semibold text-accent border-orange-200 shadow-sm">
              <Sparkles size={14} /> Next-Gen Technical Screening & Proctoring Platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl md:text-6xl leading-tight">
              Screen candidates at scale with <span className="text-accent underline decoration-accent/30 decoration-wavy">operational confidence</span>.
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-text-muted leading-relaxed">
              Flint unifies proctored MCQ exams, real-time online coding contests, and assignment evaluations with server-authoritative timing, multi-tenancy RLS, and integrity signals.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white hover:bg-accent-strong transition shadow-md hover:-translate-y-0.5">
                Access Platform Portal <ArrowRight size={18} />
              </Link>
              <Link href="/features" className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-text hover:bg-surface-soft transition shadow-sm">
                Explore Workflows
              </Link>
            </div>
          </div>
        </section>

        {/* Instant Test Credentials Banner */}
        <section className="container-page">
          <div className="surface-card p-6 md:p-8 bg-slate-900 text-white rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="text-accent" size={20} /> Pre-Seeded Test Credentials
                </h3>
                <p className="text-xs text-slate-400 mt-1">Use these accounts to instantly test any role (Password for all: <code className="text-accent font-mono bg-slate-800 px-1.5 py-0.5 rounded">password123</code>)</p>
              </div>
              <Link href="/login" className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent-strong transition">
                Go to Login →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Organization Admin</p>
                <p className="font-mono text-sm text-white font-bold">a1@test.com</p>
                <p className="text-[11px] text-slate-400">Create exams, contests, toggle score release & inspect candidate answers.</p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Candidate / Student</p>
                <p className="font-mono text-sm text-white font-bold">c1@test.com</p>
                <p className="text-[11px] text-slate-400">Join orgs with invite codes, take proctored tests, and solve IDE problems.</p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">System Maintainer</p>
                <p className="font-mono text-sm text-white font-bold">m1@test.com</p>
                <p className="text-[11px] text-slate-400">Global overview across all tenant orgs, system metrics & admin provisioning.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Core Assessment Modules */}
        <section className="container-page space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Comprehensive Screening Toolkit</h2>
            <p className="text-sm text-text-muted">Everything you need to evaluate technical talent objectively and securely.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="surface-card p-6 space-y-4 hover-lift">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-accent flex items-center justify-center font-bold">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-semibold">Proctored MCQ Exams</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Single and multi-choice questions with auto-saved answers, monotonic server timing, auto-grading, and teacher score release controls.
              </p>
            </article>

            <article className="surface-card p-6 space-y-4 hover-lift">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Code2 size={24} />
              </div>
              <h3 className="text-lg font-semibold">Coding Contests & IDE</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                In-browser code editor with Python and JavaScript execution, sample/hidden test cases, and real-time broadcast leaderboards.
              </p>
            </article>

            <article className="surface-card p-6 space-y-4 hover-lift">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-semibold">Event-Based Proctoring</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Mandatory fullscreen start modal, tab-switch alerts, devtools detection, live student warning toasts, and multi-session lockouts.
              </p>
            </article>
          </div>
        </section>

        {/* Integrity Event Matrix */}
        <section className="container-page">
          <div className="surface-card p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Proctoring Violation Matrix</h2>
                <p className="text-xs text-text-muted mt-1">Weighted integrity scoring automatically flags suspicious candidate attempts for admin review.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                <ShieldCheck size={14} /> Server-Authoritative
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b text-text-muted text-xs uppercase tracking-wider bg-surface-soft/50">
                    <th className="py-3 px-4 font-semibold">Event Type</th>
                    <th className="py-3 px-4 font-semibold">Detection Trigger</th>
                    <th className="py-3 px-4 font-semibold">Weight</th>
                    <th className="py-3 px-4 font-semibold">Integrity Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {integrityRows.map(([event, trigger, weight, action]) => (
                    <tr key={event} className="hover:bg-surface-soft/60 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-accent">{event}</td>
                      <td className="py-3 px-4 text-xs text-text-muted">{trigger}</td>
                      <td className="py-3 px-4 font-bold text-xs">{weight}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          action.includes('Lockout') ? 'bg-purple-100 text-purple-800' :
                          action.includes('Red') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-surface py-8">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-xs text-text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Flint · Secure Hackathon & Recruitment Assessment Platform</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-text transition">Sign In</Link>
            <Link href="/register" className="hover:text-text transition">Register Candidate</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
