-- Phase 2 DB Additions

-- 1. Add active_session_token to exam_attempts for multi-session heartbeat tracking
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- 2. Create Storage Bucket for Assignment Submissions (if not existing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Read Assignment Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Authenticated Upload Assignment Files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND auth.role() = 'authenticated'
);
