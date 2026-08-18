import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Code, Terminal, ChevronRight } from 'lucide-react'

export default async function CandidateOrgDashboard({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: org, error } = await supabase.from('orgs').select('name').eq('id', org_id).single()

  if (error || !org) {
    redirect('/candidate')
  }

  // Check enrollment
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('org_id', org_id).eq('candidate_id', user.id).single()
  if (!enrollment) {
    redirect('/candidate?error=Not enrolled in this organization.')
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <header className="mb-6 surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Classroom</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{org.name}</h1>
        <p className="mt-1 text-sm text-text-muted">Access your exams, assignments, and contests for this class.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/candidate/orgs/${org_id}/exams`} className="surface-card hover-lift p-5 group flex flex-col justify-between h-32">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <BookOpen className="text-accent" />
            Exams
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            View pending exams <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        
        <Link href={`/candidate/orgs/${org_id}/assignments`} className="surface-card hover-lift p-5 group flex flex-col justify-between h-32">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <Code className="text-amber-500" />
            Assignments
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            View pending tasks <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href={`/candidate/orgs/${org_id}/contests`} className="surface-card hover-lift p-5 group flex flex-col justify-between h-32">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <Terminal className="text-emerald-500" />
            Coding Contests
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            Join coding events <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}
