import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const integrityRows = [
  ['tab_switch', 'visibilitychange -> hidden', '+2'],
  ['blur', 'window.blur', '+1'],
  ['fullscreen_exit', 'fullscreenchange -> not fullscreen', '+3'],
  ['devtools', 'open-devtools heuristic', '+3'],
  ['multi_session', 'second active session detected', '+5'],
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
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <Image src="/flint-griffin-logo.svg" alt="Flint Logo" width={32} height={32} />
            Flint
          </div>
          <nav className="hidden items-center gap-5 text-sm text-text-muted md:flex">
            <Link className="hover:text-text" href="/features">Features</Link>
            <Link className="hover:text-text" href="/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Sign in</Link>
            <Link href="/register" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong">Join candidate</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container-page py-10 md:py-12">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
            <div className="surface-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Mission control</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
                Screen candidates at scale with operational confidence.
              </h1>
              <p className="mt-4 max-w-xl text-text-muted">
                Flint unifies proctored MCQ exams, coding rounds, and assignments with strict role-based boundaries,
                server-authoritative timing, and practical integrity signals.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/login" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong">
                  Start pilot
                </Link>
                <Link href="/features" className="rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-soft">
                  View workflows
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <article className="surface-card hover-lift bg-surface-soft p-3">
                  <p className="text-xs text-text-muted">Setup time</p>
                  <p className="mt-1 font-mono text-xl font-semibold">&lt;10 min</p>
                </article>
                <article className="surface-card hover-lift bg-surface-soft p-3">
                  <p className="text-xs text-text-muted">Concurrent load</p>
                  <p className="mt-1 font-mono text-xl font-semibold">150+</p>
                </article>
                <article className="surface-card hover-lift bg-surface-soft p-3">
                  <p className="text-xs text-text-muted">RLS leakage</p>
                  <p className="mt-1 font-mono text-xl font-semibold">0</p>
                </article>
              </div>
            </div>

            <div className="surface-card p-5 md:p-6">
              <div className="flex items-center justify-between border-b pb-3">
                <p className="text-sm font-semibold">Live Session Monitor</p>
                <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                  <span className="live-dot" /> Live
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="Active candidates" value="100+" hint="Open participant list" />
                <Metric label="Live sessions" value="4" hint="Inspect running windows" />
                <Metric label="Flagged events (1h)" value="18" hint="Review queue" tone="warning" />
                <Metric label="Timer drift" value="0s" hint="Server clock healthy" tone="success" />
              </div>

              <div className="mt-4 rounded-lg border bg-surface-soft p-3">
                <p className="text-xs font-medium text-text-muted">Recent integrity feed</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {[
                    ['10:33:41', 'tab_switch', 'Aditi S.', '+2', 'amber'],
                    ['10:34:08', 'fullscreen_exit', 'Rahul V.', '+3', 'rose'],
                    ['10:34:56', 'multi_session', 'Arjun M.', '+5', 'rose'],
                  ].map(([time, event, name, score, tone]) => (
                    <li key={`${time}-${event}`}>
                      <button type="button" className="group flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-white">
                        <span className="font-mono">{time} · {event} · {name}</span>
                        <span className="flex items-center gap-2">
                          <span className={tone === 'amber' ? 'rounded bg-amber-100 px-2 py-0.5 text-amber-800' : 'rounded bg-rose-100 px-2 py-0.5 text-rose-700'}>{score}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition group-hover:opacity-100" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page pb-8">
          <div className="surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Integrity event matrix</h2>
              <Link href="/features" className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                Full capability map <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b text-text-muted">
                    <th className="py-2">Event</th>
                    <th className="py-2">Trigger</th>
                    <th className="py-2">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {integrityRows.map(([event, trigger, weight]) => (
                    <tr key={event} className="group border-b transition hover:bg-surface-soft/70">
                      <td className="py-2 font-mono text-xs">{event}</td>
                      <td className="py-2 text-xs text-text-muted">{trigger}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                          {weight}
                          <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
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

      <footer className="border-t bg-surface py-6">
        <div className="container-page flex flex-col items-start justify-between gap-2 text-sm text-text-muted md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Flint · Secure hackathon screening platform</p>
          <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Event-based proctoring · Human-reviewed flags</p>
        </div>
      </footer>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint: string
  tone?: 'default' | 'success' | 'warning'
}) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-accent'

  return (
    <article className="group rounded-lg border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-text-muted opacity-0 transition group-hover:opacity-100">
        {hint} <ChevronRight className="h-3 w-3" />
      </p>
    </article>
  )
}
