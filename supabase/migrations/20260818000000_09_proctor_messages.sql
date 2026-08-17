-- Add proctor_messages JSONB array to exam_attempts and contest_attempts for live messaging
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS proctor_messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contest_attempts ADD COLUMN IF NOT EXISTS proctor_messages JSONB DEFAULT '[]'::jsonb;
