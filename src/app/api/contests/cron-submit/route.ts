import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Fetch all in_progress contest attempts with their contest details
  const { data: attempts, error } = await supabase
    .from('contest_attempts')
    .select('id, contest_id, candidate_id, started_at, contests(duration_minutes)')
    .eq('status', 'in_progress')

  if (error || !attempts) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch contest attempts' })
  }

  const now = Date.now()
  const autoSubmittedIds: string[] = []

  for (const attempt of attempts) {
    const durationMinutes = (attempt.contests as any)?.duration_minutes || 90
    const startedAtMs = new Date(attempt.started_at).getTime()
    const expiresAtMs = startedAtMs + durationMinutes * 60 * 1000

    if (now >= expiresAtMs) {
      // Mark as auto_submitted
      await supabase
        .from('contest_attempts')
        .update({
          status: 'auto_submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', attempt.id)

      autoSubmittedIds.push(attempt.id)
    }
  }

  return NextResponse.json({
    success: true,
    processedCount: attempts.length,
    autoSubmittedCount: autoSubmittedIds.length,
    autoSubmittedIds
  })
}
