import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Flint</Link>
          <Link href="/features" className="rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-surface-soft">Features</Link>
        </div>
      </header>

      <main className="container-page py-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Contact</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Let’s set up your screening workflow</h1>
          <p className="mt-2 max-w-3xl text-text-muted">
            Share your candidate volume, rounds, and timeline. We can help map a practical Flint rollout.
          </p>
        </div>

        <section className="surface-card p-6 md:p-8">
          <form className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Name</span>
              <input className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" type="text" placeholder="Your name" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Email</span>
              <input className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" type="email" placeholder="you@org.edu" />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              <span>Organization</span>
              <input className="h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" type="text" placeholder="College / Hackathon / Club" />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              <span>Message</span>
              <textarea className="rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2" rows={5} placeholder="Tell us your requirements" />
            </label>
            <button type="button" className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong">Send inquiry</button>
          </form>
        </section>
      </main>
    </div>
  )
}
