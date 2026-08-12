-- Add active_session_token and last_heartbeat to contest_attempts for multi-session heartbeat tracking
ALTER TABLE contest_attempts ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE contest_attempts ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- Allow violation_events to link to contest_attempts as well as exam_attempts
ALTER TABLE violation_events ALTER COLUMN attempt_id DROP NOT NULL;
ALTER TABLE violation_events ADD COLUMN IF NOT EXISTS contest_attempt_id UUID REFERENCES contest_attempts(id) ON DELETE CASCADE;
