import { createClient } from '@/utils/supabase/server'
import { formatDateTime } from '@/utils/formatDate'
import { createExam } from './actions'
import { ExamCardActions } from './ExamCardActions'
import { FileText, Users } from 'lucide-react'

export default async function AdminExams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: org } = await supabase.from('orgs').select('id').limit(1).single()

  // Fetch exams with question and attempt counts
  let exams: any[] = []
  let questionCounts = new Map<string, number>()
  let attemptCounts = new Map<string, number>()

  if (org) {
    const { data: examData } = await supabase.from('exams').select('*').eq('org_id', org.id).order('created_at', { ascending: false })
    exams = examData || []

    if (exams.length > 0) {
      const examIds = exams.map(e => e.id)

      // Fetch question counts per exam
      const { data: questions } = await supabase.from('questions').select('exam_id').in('exam_id', examIds)
      for (const q of (questions || [])) {
        questionCounts.set(q.exam_id, (questionCounts.get(q.exam_id) || 0) + 1)
      }

      // Fetch attempt counts per exam
      const { data: attempts } = await supabase.from('exam_attempts').select('exam_id').in('exam_id', examIds)
      for (const a of (attempts || [])) {
        attemptCounts.set(a.exam_id, (attemptCounts.get(a.exam_id) || 0) + 1)
      }
    }
  }

  if (!org) {
    return <div className="container-page py-8 text-text-muted">Please create an organization first on the dashboard.</div>
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Exams</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-text-muted">All Exams</h2>
          {exams.length === 0 ? (
            <div className="p-8 border border-line border-dashed rounded-xl text-center text-text-muted">
              No exams created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const qCount = questionCounts.get(exam.id) || 0
                const aCount = attemptCounts.get(exam.id) || 0

                return (
                  <div key={exam.id} className="surface-card hover-lift p-5 group">
                    <div className="flex justify-between items-start mb-2">
                      <a href={`/admin/exams/${exam.id}`} className="font-semibold text-lg text-accent hover:text-accent-strong hover:underline">{exam.title}</a>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider ${
                          exam.status === 'live' ? 'bg-emerald-100 text-emerald-700' :
                          exam.status === 'closed' ? 'bg-rose-100 text-rose-700' :
                          'bg-surface-soft text-text-muted'
                        }`}>
                          {exam.status}
                        </span>
                        <ExamCardActions examId={exam.id} />
                      </div>
                    </div>
                    <p className="text-text-muted text-sm">{exam.description}</p>
                    <div className="mt-4 text-xs text-text-muted flex flex-wrap gap-4 items-center">
                      <span>Duration: {exam.duration_minutes}m</span>
                      <span suppressHydrationWarning>Starts: {exam.start_at ? formatDateTime(exam.start_at) : 'Anytime'}</span>
                      <span className="inline-flex items-center gap-1">
                        <FileText size={12} />
                        {qCount} question{qCount !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} />
                        {aCount} attempt{aCount !== 1 ? 's' : ''}
                      </span>
                      {exam.negative_marking && (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-semibold uppercase">Neg. Marking</span>
                      )}
                      {exam.randomize && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold uppercase">Randomized</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <form action={createExam} className="surface-card p-5 space-y-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Create New Exam</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
              <input name="title" required className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" placeholder="e.g. Midterm Assessment" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full rounded-md border bg-white px-3 py-2 outline-none ring-accent focus:ring-2 resize-none" placeholder="..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Duration (mins)</label>
              <input type="number" name="duration_minutes" required defaultValue="60" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Start Time (Opt)</label>
              <input type="datetime-local" name="start_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">End Time (Opt)</label>
              <input type="datetime-local" name="end_at" className="w-full h-10 rounded-md border bg-white px-3 outline-none ring-accent focus:ring-2" />
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="negative_marking" className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
                <span className="text-text-muted font-medium">Negative Marking</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="randomize" className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
                <span className="text-text-muted font-medium">Randomize</span>
              </label>
            </div>

            <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-accent-strong mt-4">
              Create Draft
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
