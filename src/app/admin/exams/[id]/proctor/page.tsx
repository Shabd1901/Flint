import { createClient } from '@/utils/supabase/server'
import { ProctorDashboard } from './ProctorDashboard'

export default async function LiveProctorConsole({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).single()
  
  // We fetch initial state of in_progress attempts. Realtime will handle updates.
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, profiles(name, email)')
    .eq('exam_id', id)
    .eq('status', 'in_progress')

  return (
    <ProctorDashboard examId={id} examTitle={exam?.title || 'Exam'} initialAttempts={attempts || []} />
  )
}
