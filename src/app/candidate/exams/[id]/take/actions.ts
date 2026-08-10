'use server'

import { createClient } from '@/utils/supabase/server'

export async function logViolation(attemptId: string, type: string, meta?: any) {
  const supabase = await createClient()
  await supabase.from('violation_events').insert({
    attempt_id: attemptId,
    type,
    meta: meta || {}
  })
}
