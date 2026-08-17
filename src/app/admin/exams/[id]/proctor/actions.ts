'use server'

import { createClient } from '@/utils/supabase/server'

export async function forceSubmitSession(attemptId: string) {
  const supabase = await createClient()
  
  // Verify admin permissions indirectly by checking if user is logged in
  // RLS will enforce they can update this attempt
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('exam_attempts').update({
    status: 'submitted',
    submitted_at: new Date().toISOString()
  }).eq('id', attemptId)
}

export async function sendProctorMessage(attemptId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: attempt } = await supabase.from('exam_attempts').select('proctor_messages').eq('id', attemptId).single()
  if (!attempt) return

  const currentMessages = attempt.proctor_messages || []
  const newMessage = {
    id: crypto.randomUUID(),
    text,
    sender: 'proctor',
    timestamp: new Date().toISOString()
  }

  await supabase.from('exam_attempts').update({
    proctor_messages: [...currentMessages, newMessage]
  }).eq('id', attemptId)
}
