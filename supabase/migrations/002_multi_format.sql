-- 1. Expand question_type enum with new formats
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'true_false';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'short_answer';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'long_answer';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'fill_blank';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'numerical';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'file_upload';

-- 2. Add columns to questions table for new types
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_text TEXT;        -- for short_answer, fill_blank
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_number NUMERIC;   -- for numerical
ALTER TABLE questions ADD COLUMN IF NOT EXISTS tolerance NUMERIC;        -- for numerical (±tolerance)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS max_words INT;            -- for long_answer word limit
ALTER TABLE questions ADD COLUMN IF NOT EXISTS file_types TEXT[];        -- for file_upload allowed extensions

-- 3. Add columns to exam_answers for new response types
ALTER TABLE exam_answers ALTER COLUMN selected_options DROP NOT NULL;    -- MCQ answers stay here
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS text_answer TEXT;      -- for short/long/fill
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS number_answer NUMERIC; -- for numerical
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS file_url TEXT;         -- for file_upload

-- 4. Add submission_type to assignments for multi-format
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_types TEXT[] DEFAULT '{file,link,text}';

-- 5. Add text_answer column to assignment_submissions
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS text_answer TEXT;

-- 6. Create storage bucket for exam file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-uploads', 'exam-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Exam Files" ON storage.objects
FOR SELECT USING (bucket_id = 'exam-uploads');

CREATE POLICY "Authenticated Upload Exam Files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'exam-uploads' AND auth.role() = 'authenticated');
