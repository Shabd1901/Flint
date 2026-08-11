-- Fix column alignment between schema and application code
-- Adds missing columns that the app code expects but the original migration didn't define

-- Add description column to exams
ALTER TABLE exams ADD COLUMN IF NOT EXISTS description TEXT;

-- Add created_at columns (app code orders by these)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add invite_code to orgs for candidate enrollment flow
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8);
