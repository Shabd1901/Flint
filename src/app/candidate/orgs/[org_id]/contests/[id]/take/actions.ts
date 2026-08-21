'use server'

import { createClient } from '@/utils/supabase/server'
import { runCode, ExecutionResult } from '@/utils/compiler'

export async function getTestCases(problemId: string, type: 'sample' | 'all') {
  const supabase = await createClient()
  
  let query = supabase.from('test_cases').select('*').eq('problem_id', problemId)
  if (type === 'sample') {
    query = query.eq('is_sample', true)
  }
  
  const { data: testCases } = await query
  return testCases || []
}

export async function saveSubmission(
  contestId: string,
  contestAttemptId: string,
  problemId: string,
  language: string,
  sourceCode: string,
  results: any[],
  passedCount: number,
  totalCount: number,
  score: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Persist code_submission
  await supabase.from('code_submissions').insert({
    contest_attempts_id: contestAttemptId,
    problem_id: problemId,
    language,
    source_code: sourceCode,
    passed_count: passedCount,
    total_count: totalCount,
    score: score,
    judge_raw: JSON.stringify(results)
  })

  // Fetch profile name for broadcast
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single()

  // Broadcast score update on Realtime channel
  const channel = supabase.channel(`contest:${contestId}:leaderboard`)
  await channel.send({
    type: 'broadcast',
    event: 'score_update',
    payload: {
      candidate_id: user!.id,
      name: profile?.name || 'Candidate',
      score: score,
      passed_count: passedCount,
      total_count: totalCount
    }
  })

  return { success: true }
}

export async function logContestViolation(attemptId: string, type: string, meta?: any) {
  const supabase = await createClient()

  await supabase.from('violation_events').insert({
    contest_attempt_id: attemptId,
    type,
    meta: meta || {}
  })
}

export async function heartbeatContestSession(attemptId: string, sessionToken: string): Promise<{ valid: boolean }> {
  const supabase = await createClient()

  const { data: attempt, error } = await supabase
    .from('contest_attempts')
    .select('active_session_token, last_heartbeat')
    .eq('id', attemptId)
    .single()

  if (error || !attempt) {
    return { valid: false }
  }

  if (!attempt.active_session_token) {
    await supabase
      .from('contest_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  if (attempt.active_session_token === sessionToken) {
    await supabase
      .from('contest_attempts')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  const lastHeartbeat = attempt.last_heartbeat ? new Date(attempt.last_heartbeat).getTime() : 0
  const now = Date.now()

  if (now - lastHeartbeat > 15000) {
    await supabase
      .from('contest_attempts')
      .update({ active_session_token: sessionToken, last_heartbeat: new Date().toISOString() })
      .eq('id', attemptId)
    return { valid: true }
  }

  await logContestViolation(attemptId, 'multi_session', { action: 'concurrent_session_detected', new_token: sessionToken })
  return { valid: false }
}
