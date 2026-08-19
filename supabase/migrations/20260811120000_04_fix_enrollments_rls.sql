-- Fix RLS Policies for candidate enrollment and org lookup by invite code

-- 1. Allow authenticated candidates to insert into enrollments for themselves
DROP POLICY IF EXISTS "Candidate insert own enrollments" ON enrollments;
CREATE POLICY "Candidate insert own enrollments" ON enrollments 
FOR INSERT 
WITH CHECK (candidate_id = auth.uid());

-- 2. Allow candidates to read orgs if enrolled OR if org has an invite code
DROP POLICY IF EXISTS "Candidate read orgs" ON orgs;
CREATE POLICY "Candidate read orgs" ON orgs 
FOR SELECT 
USING (is_enrolled(id) OR invite_code IS NOT NULL);
