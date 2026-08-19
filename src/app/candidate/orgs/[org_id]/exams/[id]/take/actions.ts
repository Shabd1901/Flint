'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSB } from '@supabase/supabase-js'

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

    const adminClient = createSB(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await adminClient
      .from('exam_attempts')
      .update({ violation_score: totalScore })
      .eq('id', attemptId)
  }
}

export async function heartbeatSession(attemptId: string, sessionToken: string): Promise<{ valid: boolean }> {
  const supabase = await createClient()

  // Fetch current active_session_token
  const { data: attempt, error } = await supabase
    .from('exam_attempts')
    .select('active_session_token, last_heartbeat')
    .eq('id', attemptId)
    .single()

  console.log('[DEBUG] Heartbeat called', { attemptId, sessionToken, attempt, error })

  if (error || !attempt) {
    console.log('[DEBUG] Returning false because attempt not found or error', error)
    return { valid: false }
  }

  const adminClient = createSB(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // If token is null/empty, register current token
  if (!attempt.active_session_token) {
    console.log('[DEBUG] Registering new token', sessionToken)
    await adminClient
      .from('exam_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  // If token matches, refresh heartbeat
  if (attempt.active_session_token === sessionToken) {
    console.log('[DEBUG] Token matches, refreshing')
    await adminClient
      .from('exam_attempts')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  // Token mismatch! Check if the old session is dead (no heartbeat in 15s)
  const lastHeartbeat = attempt.last_heartbeat ? new Date(attempt.last_heartbeat).getTime() : 0
  const now = Date.now()

  console.log('[DEBUG] Token mismatch!', { 
    dbToken: attempt.active_session_token, 
    clientToken: sessionToken, 
    lastHeartbeat, 
    now, 
    diff: now - lastHeartbeat 
  })

  if (now - lastHeartbeat > 15000) {
    console.log('[DEBUG] Old session is dead, taking over')
    // The previous tab/window was closed or lost connection. Safe to take over.
    await adminClient
      .from('exam_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  console.log('[DEBUG] True multi-session detected, logging violation')
  // The previous session is still alive (sent a heartbeat recently). True multi-session!
  await logViolation(attemptId, 'multi_session', { action: 'concurrent_session_detected', new_token: sessionToken })
  return { valid: false }
}
