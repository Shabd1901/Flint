-- 1. Fix DB Privilege Escalation (Nuclear Grant Statement)
-- Revoke the excessive "ALL" privileges from anon and authenticated roles
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Restore standard strict Supabase privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;
-- Do not grant execute on routines to anon unless explicitly needed

-- 2. Fix Storage Bucket Enumeration Vulnerability
-- Drop the overly permissive SELECT policies that allow anyone to enumerate/list bucket contents
DROP POLICY IF EXISTS "Public Read Assignment Files" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Exam Files" ON storage.objects;

-- Create strict policies so ONLY the file owner can list/enumerate their own files
CREATE POLICY "Users can list their own assignment files" ON storage.objects FOR SELECT USING (bucket_id = 'assignment-submissions' AND auth.uid() = owner);
CREATE POLICY "Users can list their own exam files" ON storage.objects FOR SELECT USING (bucket_id = 'exam-uploads' AND auth.uid() = owner);
