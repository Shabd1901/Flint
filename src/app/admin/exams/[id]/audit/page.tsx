import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Clock, History } from 'lucide-react'
import Link from 'next/link'

export default async function ExamAuditTrail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase.from('exams').select('title').eq('id', id).single()

  const { data: edits } = await supabase
    .from('question_edits')
    .select(`
      *,
      questions(text, type),
      profiles(name)
    `)
    // Normally we'd filter by exam_id through questions, but PostgREST can do embedded filtering or we can just fetch all for the exam.
    // For simplicity, we just fetch all question_edits where the question belongs to this exam.
    // However, Supabase doesn't natively support filtering top-level by embedded join condition easily without inner joins.
    // Let's do it in two steps for type safety.
    .order('created_at', { ascending: false })

  const { data: questions } = await supabase.from('questions').select('id').eq('exam_id', id)
  const questionIds = questions?.map(q => q.id) || []
  
  const filteredEdits = (edits || []).filter(e => questionIds.includes(e.question_id))

  return (
    <div className="container-page py-6 md:py-8 space-y-6 max-w-4xl">
      <Link href={`/admin/exams/${id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Exam Settings
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <History className="text-accent" /> Audit Trail: {exam?.title}
        </h1>
        <p className="text-text-muted mt-1">Immutable log of mid-exam question and answer-key edits.</p>
      </div>

      <div className="space-y-4">
        {filteredEdits.length === 0 ? (
          <div className="surface-card p-12 text-center text-text-muted">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No post-publish edits have been made to this exam.</p>
          </div>
        ) : (
          filteredEdits.map((edit: any) => (
            <div key={edit.id} className="surface-card p-5">
              <div className="flex justify-between items-start border-b border-line pb-3 mb-3">
                <div>
                  <h3 className="font-semibold text-sm">Question ID: {edit.question_id}</h3>
                  <p className="text-xs text-text-muted mt-1">Edited by: {edit.profiles?.name || edit.admin_id}</p>
                </div>
                <span className="text-xs text-text-muted bg-surface-soft px-2 py-1 rounded">
                  {new Date(edit.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-md overflow-x-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-2">Previous State</span>
                  <pre className="text-rose-900">{JSON.stringify(edit.previous_state, null, 2)}</pre>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md overflow-x-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-2">New State</span>
                  <pre className="text-emerald-900">{JSON.stringify(edit.new_state, null, 2)}</pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
