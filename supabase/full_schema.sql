-- =========================================================
-- Flint Full Database Schema & RLS Setup
-- =========================================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('maintainer', 'admin', 'candidate');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM ('draft', 'live', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('single', 'multi');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'auto_submitted');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE violation_type AS ENUM ('tab_switch', 'fullscreen_exit', 'blur', 'multi_session', 'devtools');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Orgs Table
CREATE TABLE IF NOT EXISTS orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Org Admins Table (Junction)
CREATE TABLE IF NOT EXISTS org_admins (
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (org_id, admin_id)
);

-- 4. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, candidate_id)
);

-- 5. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    negative_marking BOOLEAN NOT NULL DEFAULT false,
    randomize BOOLEAN NOT NULL DEFAULT false,
    status exam_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type question_type NOT NULL,
    options JSONB NOT NULL,
    correct_options JSONB NOT NULL,
    marks NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Exam Attempts Table
CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score NUMERIC,
    violation_score NUMERIC DEFAULT 0,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    active_session_token TEXT,
    last_heartbeat TIMESTAMPTZ
);

-- 8. Exam Answers Table
CREATE TABLE IF NOT EXISTS exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_options JSONB NOT NULL
);

-- 9. Violation Events Table
CREATE TABLE IF NOT EXISTS violation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    type violation_type NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meta JSONB
);

-- 10. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    max_score NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    link_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    score NUMERIC,
    feedback TEXT,
    version INT NOT NULL DEFAULT 1
);

-- 12. Contests Table
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    duration_minutes INT NOT NULL,
    status exam_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Problems Table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    starter_code JSONB,
    languages JSONB NOT NULL
);

-- 14. Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    weight NUMERIC NOT NULL DEFAULT 1
);

-- 15. Contest Attempts Table
CREATE TABLE IF NOT EXISTS contest_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status attempt_status NOT NULL DEFAULT 'in_progress'
);

-- 16. Code Submissions Table
CREATE TABLE IF NOT EXISTS code_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_attempts_id UUID NOT NULL REFERENCES contest_attempts(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    source_code TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    passed_count INT NOT NULL DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    score NUMERIC NOT NULL DEFAULT 0,
    judge_raw JSONB
);

-- =========================================================
-- Enable Row-Level Security
-- =========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Helper Functions for RLS
-- =========================================================
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orgs WHERE id = check_org_id AND admin_id = auth.uid()
    UNION
    SELECT 1 FROM org_admins WHERE org_id = check_org_id AND admin_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_enrolled(check_org_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM enrollments WHERE org_id = check_org_id AND candidate_id = auth.uid());
$$;

-- =========================================================
-- RLS Policies
-- =========================================================

-- Maintainer full access for all public tables
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename NOT IN ('pg_stat_statements', 'pg_stat_statements_info')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Maintainer full access %I" ON %I;', t_name, t_name);
        EXECUTE format('CREATE POLICY "Maintainer full access %I" ON %I FOR ALL USING (get_user_role() = ''maintainer'');', t_name, t_name);
    END LOOP;
END
$$;

-- Profiles
DROP POLICY IF EXISTS "Users access own profile" ON profiles;
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (id = auth.uid());

-- Orgs
DROP POLICY IF EXISTS "Admin access own orgs" ON orgs;
CREATE POLICY "Admin access own orgs" ON orgs FOR ALL USING (is_org_admin(id) OR get_user_role() = 'maintainer');

DROP POLICY IF EXISTS "Candidate read orgs" ON orgs;
CREATE POLICY "Candidate read orgs" ON orgs FOR SELECT USING (is_enrolled(id) OR invite_code IS NOT NULL);

-- Org Admins
DROP POLICY IF EXISTS "Admins can view their org admins" ON org_admins;
CREATE POLICY "Admins can view their org admins" ON org_admins FOR SELECT USING (is_org_admin(org_id) OR get_user_role() = 'maintainer');

DROP POLICY IF EXISTS "Admins can insert org admins" ON org_admins;
CREATE POLICY "Admins can insert org admins" ON org_admins FOR INSERT WITH CHECK (is_org_admin(org_id) OR get_user_role() = 'maintainer');

DROP POLICY IF EXISTS "Admins can delete org admins" ON org_admins;
CREATE POLICY "Admins can delete org admins" ON org_admins FOR DELETE USING (is_org_admin(org_id) OR get_user_role() = 'maintainer');

-- Enrollments
DROP POLICY IF EXISTS "Admin access enrollments" ON enrollments;
CREATE POLICY "Admin access enrollments" ON enrollments FOR ALL USING (is_org_admin(org_id));

DROP POLICY IF EXISTS "Candidate access own enrollments" ON enrollments;
CREATE POLICY "Candidate access own enrollments" ON enrollments FOR SELECT USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Candidate insert own enrollments" ON enrollments;
CREATE POLICY "Candidate insert own enrollments" ON enrollments FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- Exams
DROP POLICY IF EXISTS "Admin access exams" ON exams;
CREATE POLICY "Admin access exams" ON exams FOR ALL USING (is_org_admin(org_id));

DROP POLICY IF EXISTS "Candidate read exams" ON exams;
CREATE POLICY "Candidate read exams" ON exams FOR SELECT USING (is_enrolled(org_id) AND status != 'draft');

-- Questions
DROP POLICY IF EXISTS "Admin access questions" ON questions;
CREATE POLICY "Admin access questions" ON questions FOR ALL USING (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND is_org_admin(exams.org_id))
);

DROP POLICY IF EXISTS "Candidate read questions" ON questions;
CREATE POLICY "Candidate read questions" ON questions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM exam_attempts
        WHERE exam_attempts.exam_id = questions.exam_id
        AND exam_attempts.candidate_id = auth.uid()
        AND exam_attempts.status != 'submitted'
    )
);

-- Exam Attempts
DROP POLICY IF EXISTS "Admin read exam_attempts" ON exam_attempts;
CREATE POLICY "Admin read exam_attempts" ON exam_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND is_org_admin(exams.org_id))
);

DROP POLICY IF EXISTS "Candidate access own exam_attempts" ON exam_attempts;
CREATE POLICY "Candidate access own exam_attempts" ON exam_attempts FOR ALL USING (candidate_id = auth.uid());

-- Exam Answers
DROP POLICY IF EXISTS "Admin read exam_answers" ON exam_answers;
CREATE POLICY "Admin read exam_answers" ON exam_answers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM exam_attempts
        JOIN exams ON exams.id = exam_attempts.exam_id
        WHERE exam_attempts.id = attempt_id
        AND is_org_admin(exams.org_id)
    )
);

DROP POLICY IF EXISTS "Candidate access own exam_answers" ON exam_answers;
CREATE POLICY "Candidate access own exam_answers" ON exam_answers FOR ALL USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())
);

-- Violation Events
DROP POLICY IF EXISTS "Admin read violation_events" ON violation_events;
CREATE POLICY "Admin read violation_events" ON violation_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM exam_attempts
        JOIN exams ON exams.id = exam_attempts.exam_id
        WHERE exam_attempts.id = attempt_id
        AND is_org_admin(exams.org_id)
    )
);

DROP POLICY IF EXISTS "Candidate insert violation_events" ON violation_events;
CREATE POLICY "Candidate insert violation_events" ON violation_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())
);

-- Assignments
DROP POLICY IF EXISTS "Admin access assignments" ON assignments;
CREATE POLICY "Admin access assignments" ON assignments FOR ALL USING (is_org_admin(org_id));

DROP POLICY IF EXISTS "Candidate read assignments" ON assignments;
CREATE POLICY "Candidate read assignments" ON assignments FOR SELECT USING (is_enrolled(org_id));

-- Assignment Submissions
DROP POLICY IF EXISTS "Admin access assignment_submissions" ON assignment_submissions;
CREATE POLICY "Admin access assignment_submissions" ON assignment_submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_id AND is_org_admin(assignments.org_id))
);

DROP POLICY IF EXISTS "Candidate access own assignment_submissions" ON assignment_submissions;
CREATE POLICY "Candidate access own assignment_submissions" ON assignment_submissions FOR ALL USING (candidate_id = auth.uid());

-- Contests
DROP POLICY IF EXISTS "Admin access contests" ON contests;
CREATE POLICY "Admin access contests" ON contests FOR ALL USING (is_org_admin(org_id));

DROP POLICY IF EXISTS "Candidate read contests" ON contests;
CREATE POLICY "Candidate read contests" ON contests FOR SELECT USING (is_enrolled(org_id) AND status != 'draft');

-- Problems
DROP POLICY IF EXISTS "Admin access problems" ON problems;
CREATE POLICY "Admin access problems" ON problems FOR ALL USING (
    EXISTS (SELECT 1 FROM contests WHERE contests.id = contest_id AND is_org_admin(contests.org_id))
);

DROP POLICY IF EXISTS "Candidate read problems" ON problems;
CREATE POLICY "Candidate read problems" ON problems FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM contest_attempts
        WHERE contest_attempts.contest_id = problems.contest_id
        AND contest_attempts.candidate_id = auth.uid()
        AND contest_attempts.status != 'submitted'
    )
);

-- Test Cases
DROP POLICY IF EXISTS "Admin access test_cases" ON test_cases;
CREATE POLICY "Admin access test_cases" ON test_cases FOR ALL USING (
    EXISTS (
        SELECT 1 FROM problems
        JOIN contests ON contests.id = problems.contest_id
        WHERE problems.id = problem_id
        AND is_org_admin(contests.org_id)
    )
);

DROP POLICY IF EXISTS "Candidate read sample test_cases" ON test_cases;
CREATE POLICY "Candidate read sample test_cases" ON test_cases FOR SELECT USING (
    is_sample = true AND
    EXISTS (
        SELECT 1 FROM problems
        JOIN contest_attempts ON contest_attempts.contest_id = problems.contest_id
        WHERE problems.id = problem_id
        AND contest_attempts.candidate_id = auth.uid()
        AND contest_attempts.status != 'submitted'
    )
);

-- Contest Attempts
DROP POLICY IF EXISTS "Admin read contest_attempts" ON contest_attempts;
CREATE POLICY "Admin read contest_attempts" ON contest_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM contests WHERE contests.id = contest_id AND is_org_admin(contests.org_id))
);

DROP POLICY IF EXISTS "Candidate access own contest_attempts" ON contest_attempts;
CREATE POLICY "Candidate access own contest_attempts" ON contest_attempts FOR ALL USING (candidate_id = auth.uid());

-- Code Submissions
DROP POLICY IF EXISTS "Admin read code_submissions" ON code_submissions;
CREATE POLICY "Admin read code_submissions" ON code_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM contest_attempts
        JOIN contests ON contests.id = contest_attempts.contest_id
        WHERE contest_attempts.id = contest_attempts_id
        AND is_org_admin(contests.org_id)
    )
);

DROP POLICY IF EXISTS "Candidate access own code_submissions" ON code_submissions;
CREATE POLICY "Candidate access own code_submissions" ON code_submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())
);

-- =========================================================
-- Storage Bucket for Assignment Uploads
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Assignment Files" ON storage.objects;
CREATE POLICY "Public Read Assignment Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-submissions');

DROP POLICY IF EXISTS "Authenticated Upload Assignment Files" ON storage.objects;
CREATE POLICY "Authenticated Upload Assignment Files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND auth.role() = 'authenticated'
);

-- Grants
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
