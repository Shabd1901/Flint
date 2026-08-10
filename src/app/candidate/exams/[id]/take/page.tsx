import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ExamTake({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: attempt } = await supabase.from('exam_attempts')
    .select('*')
    .eq('exam_id', params.id)
    .eq('candidate_id', user!.id)
    .single()

  if (!attempt || attempt.status !== 'in_progress') {
    redirect('/candidate/exams')
  }

  // Fetch questions (excluding correct_options for safety, although RLS doesn't drop columns, we select specific ones)
  const { data: questions } = await supabase.from('questions')
    .select('id, question_text, type, options')
    .eq('exam_id', params.id)
    .order('created_at', { ascending: true })

  // Fetch any existing answers
  const { data: answers } = await supabase.from('exam_answers').select('*').eq('attempt_id', attempt.id)
  const answersMap = new Map(answers?.map(a => [a.question_id, a]))

  async function submitExam(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()

    // We assume saving is done, just mark attempt as submitted
    // The actual grading logic would happen securely via Edge Function or here
    // For now, just mark submitted
    await s.from('exam_attempts')
      .update({ status: 'submitted', completed_at: new Date().toISOString() })
      .eq('exam_id', params.id)
      .eq('candidate_id', user!.id)

    redirect('/candidate/exams')
  }

  async function saveAnswer(formData: FormData) {
    'use server'
    const s = await createClient()
    const questionId = formData.get('question_id') as string
    const attemptId = formData.get('attempt_id') as string
    
    const selectedRaw = formData.getAll('options') // For multi
    const selectedStr = formData.get('option') // For single

    const selectedOptions = selectedRaw.length > 0 ? selectedRaw : (selectedStr ? [selectedStr] : [])

    // Upsert answer
    const { data: existing } = await s.from('exam_answers').select('id').eq('attempt_id', attemptId).eq('question_id', questionId).single()
    
    if (existing) {
      await s.from('exam_answers').update({ selected_options: JSON.stringify(selectedOptions) }).eq('id', existing.id)
    } else {
      await s.from('exam_answers').insert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_options: JSON.stringify(selectedOptions)
      })
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl sticky top-4 z-10 shadow-2xl">
        <h1 className="text-xl font-bold text-white">Exam In Progress</h1>
        <form action={submitExam}>
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors">
            Finish & Submit
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {questions?.map((q: any, i: number) => {
          const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          const existingAns = answersMap.get(q.id)
          const savedSelection = existingAns ? (typeof existingAns.selected_options === 'string' ? JSON.parse(existingAns.selected_options) : existingAns.selected_options) : []

          return (
            <div key={q.id} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
              <h3 className="text-lg font-medium text-white">
                <span className="text-zinc-500 mr-2">{i + 1}.</span>
                {q.question_text}
              </h3>

              <form action={saveAnswer} className="space-y-3">
                <input type="hidden" name="question_id" value={q.id} />
                <input type="hidden" name="attempt_id" value={attempt.id} />
                
                {opts?.map((opt: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                    <input 
                      type={q.type === 'single' ? 'radio' : 'checkbox'} 
                      name={q.type === 'single' ? 'option' : 'options'}
                      value={opt}
                      defaultChecked={savedSelection.includes(opt)}
                      className="w-4 h-4 text-indigo-600 bg-zinc-900 border-zinc-700 focus:ring-indigo-600 focus:ring-offset-zinc-950"
                      onChange={(e) => {
                         // Auto submit form on change to save draft
                         e.target.form?.requestSubmit()
                      }}
                    />
                    <span className="text-zinc-300 text-sm">{opt}</span>
                  </label>
                ))}
              </form>
            </div>
          )
        })}
      </div>
    </div>
  )
}
