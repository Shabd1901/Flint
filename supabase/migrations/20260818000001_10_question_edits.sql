-- Create table for tracking question edits (audit trail)
CREATE TABLE question_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    previous_state JSONB NOT NULL,
    new_state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE question_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read question edits" ON question_edits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM questions 
    JOIN exams ON exams.id = questions.exam_id 
    JOIN orgs ON orgs.id = exams.org_id 
    WHERE questions.id = question_edits.question_id 
    AND orgs.admin_id = auth.uid()
  )
);
