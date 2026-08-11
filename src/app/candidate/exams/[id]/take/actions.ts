'use server'

import { createClient } from '@/utils/supabase/server'

const VIOLATION_WEIGHTS: Record<string, number> = {
  tab_switch: 2,
  blur: 1,
  fullscreen_exit: 3,
  devtools: 3,
  multi_session: 5,
  copy_paste_blocked: 1,
}

export async function logViolation(attemptId: string, type: string, meta?: any) {
  const supabase = await createClient()
  
  // Insert violation event
  await supabase.from('violation_events').insert({
    attempt_id: attemptId,
    type,
    meta: meta || {}
  })

  // Compute and update violation_score (weighted sum of all events for this attempt)
  const { data: events } = await supabase
    .from('violation_events')
    .select('type')
    .eq('attempt_id', attemptId)

  if (events) {
    const totalScore = events.reduce((sum, e) => {
      return sum + (VIOLATION_WEIGHTS[e.type] || 1)
    }, 0)

    await supabase
      .from('exam_attempts')
      .update({ violation_score: totalScore })
      .eq('id', attemptId)
  }
}

export async function heartbeatSession(attemptId: string, sessionToken: string): Promise<{ valid: boolean }> {
  const supabase = await createClient()

  // Fetch current active_session_token
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('active_session_token')
    .eq('id', attemptId)
    .single()

  if (!attempt) return { valid: false }

  // If token is null/empty, register current token
  if (!attempt.active_session_token) {
    await supabase
      .from('exam_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  // If token matches, refresh heartbeat
  if (attempt.active_session_token === sessionToken) {
    await supabase
      .from('exam_attempts')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  // Token mismatch! Another active session detected!
  await logViolation(attemptId, 'multi_session', { action: 'concurrent_session_detected', new_token: sessionToken })
  return { valid: false }
}
