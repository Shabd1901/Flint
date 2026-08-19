-- 1. Restore Candidate RLS Fixes (replace FOR ALL)
-- exam_attempts
DROP POLICY IF EXISTS "Candidate access own exam_attempts" ON exam_attempts;
CREATE POLICY "Candidate select own exam_attempts" ON exam_attempts FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own exam_attempts" ON exam_attempts FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- assignment_submissions
DROP POLICY IF EXISTS "Candidate access own assignment_submissions" ON assignment_submissions;
CREATE POLICY "Candidate select own assignment_submissions" ON assignment_submissions FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own assignment_submissions" ON assignment_submissions FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- contest_attempts
DROP POLICY IF EXISTS "Candidate access own contest_attempts" ON contest_attempts;
CREATE POLICY "Candidate select own contest_attempts" ON contest_attempts FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own contest_attempts" ON contest_attempts FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- 2. Restore Late Submission DB Protection
-- exam_answers
DROP POLICY IF EXISTS "Candidate access own exam_answers" ON exam_answers;
CREATE POLICY "Candidate select own exam_answers" ON exam_answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())
);
CREATE POLICY "Candidate insert own exam_answers" ON exam_answers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = 'in_progress')
);
CREATE POLICY "Candidate update own exam_answers" ON exam_answers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = 'in_progress')
);

-- code_submissions
DROP POLICY IF EXISTS "Candidate access own code_submissions" ON code_submissions;
CREATE POLICY "Candidate select own code_submissions" ON code_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())
);
CREATE POLICY "Candidate insert own code_submissions" ON code_submissions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid() AND contest_attempts.status = 'in_progress')
);
