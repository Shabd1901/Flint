-- Add auto_release_results column to exams (defaults to true for instant MCQ results)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS auto_release_results BOOLEAN NOT NULL DEFAULT true;
