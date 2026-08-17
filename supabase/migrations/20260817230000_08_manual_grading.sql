-- Add marks_awarded column to exam_answers for manual grading capabilities
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS marks_awarded NUMERIC;
