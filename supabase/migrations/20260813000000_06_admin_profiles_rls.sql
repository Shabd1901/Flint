-- 1. Allow admins to read profiles of candidates enrolled in their organizations
CREATE POLICY "Admin read enrolled candidate profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    JOIN orgs ON orgs.id = enrollments.org_id
    WHERE enrollments.candidate_id = profiles.id
    AND orgs.admin_id = auth.uid()
  )
);

-- 2. Allow maintainers to read all candidate profiles
CREATE POLICY "Maintainer read all profiles" ON profiles
FOR SELECT USING (
  get_user_role() = 'maintainer'
);

-- 3. Update violation_events RLS policy to support both exam_attempts and contest_attempts
DROP POLICY IF EXISTS "Admin read violation_events" ON violation_events;

CREATE POLICY "Admin read violation_events" ON violation_events FOR SELECT USING (
  (
    attempt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM exam_attempts
      JOIN exams ON exams.id = exam_attempts.exam_id
      JOIN orgs ON orgs.id = exams.org_id
      WHERE exam_attempts.id = violation_events.attempt_id
      AND orgs.admin_id = auth.uid()
    )
  )
  OR
  (
    contest_attempt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM contest_attempts
      JOIN contests ON contests.id = contest_attempts.contest_id
      JOIN orgs ON orgs.id = contests.org_id
      WHERE contest_attempts.id = violation_events.contest_attempt_id
      AND orgs.admin_id = auth.uid()
    )
  )
);

-- Candidate insert policy for contest violation events
CREATE POLICY "Candidate insert contest violation_events" ON violation_events FOR INSERT WITH CHECK (
  contest_attempt_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM contest_attempts
    WHERE contest_attempts.id = contest_attempt_id
    AND contest_attempts.candidate_id = auth.uid()
  )
);
