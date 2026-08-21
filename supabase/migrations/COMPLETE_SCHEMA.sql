-- ============================================================================
-- FLINT — ALL-IN-ONE MASTER DATABASE MIGRATION SCRIPT
-- Copy & paste this entire script into your Supabase SQL Editor (New Query) and click Run.
-- It resets schema public cleanly and builds all tables, enums, indexes, functions,
-- storage buckets, and non-recursive RLS policies for every role and feature.
-- ============================================================================

-- 1. Reset Public Schema (Clean slate)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Create Custom Enums
CREATE TYPE user_role AS ENUM ('maintainer', 'admin', 'candidate');
CREATE TYPE exam_status AS ENUM ('draft', 'live', 'closed');
CREATE TYPE question_type AS ENUM ('single', 'multi', 'true_false', 'short_answer', 'long_answer', 'fill_blank', 'numerical', 'file_upload');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'auto_submitted');
CREATE TYPE violation_type AS ENUM ('tab_switch', 'fullscreen_exit', 'blur', 'multi_session', 'devtools');

-- 3. Core Tables

-- Profiles Table (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations Table
CREATE TABLE orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Co-Admins Table
CREATE TABLE org_admins (
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (org_id, admin_id)
);

-- Enrollments Table (Candidate <-> Org)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, candidate_id)
);

-- Exams Table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    negative_marking BOOLEAN NOT NULL DEFAULT false,
    randomize BOOLEAN NOT NULL DEFAULT false,
    auto_release_results BOOLEAN NOT NULL DEFAULT true,
    status exam_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exam Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type question_type NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_text TEXT,
    correct_number NUMERIC,
    tolerance NUMERIC,
    max_words INT,
    file_types TEXT[],
    marks NUMERIC NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exam Attempts Table
CREATE TABLE exam_attempts (
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

-- Exam Answers Table
CREATE TABLE exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_options JSONB,
    text_answer TEXT,
    number_answer NUMERIC,
    file_url TEXT,
    marks_awarded NUMERIC
);

-- Assignments Table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    max_score NUMERIC NOT NULL DEFAULT 100,
    submission_types TEXT[] DEFAULT '{file,link,text}',
    allowed_file_types TEXT[] DEFAULT '{pdf,csv,doc,md,xlsx}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignment Submissions Table
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    link_url TEXT,
    text_answer TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    score NUMERIC,
    feedback TEXT,
    version INT NOT NULL DEFAULT 1
);

-- Coding Contests Table
CREATE TABLE contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    duration_minutes INT NOT NULL DEFAULT 60,
    status exam_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contest Coding Problems Table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    statement TEXT,
    description TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    starter_code JSONB,
    languages JSONB NOT NULL DEFAULT '["python", "javascript", "cpp", "java"]'::jsonb
);

-- Problem Test Cases Table
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    weight NUMERIC NOT NULL DEFAULT 1
);

-- Contest Attempts Table
CREATE TABLE contest_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    active_session_token TEXT,
    last_heartbeat TIMESTAMPTZ
);

-- Violation & Integrity Log Table
CREATE TABLE violation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
    contest_attempt_id UUID REFERENCES contest_attempts(id) ON DELETE CASCADE,
    type violation_type NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meta JSONB
);

-- Code Submissions Table
CREATE TABLE code_submissions (
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

-- Hackathons Table
CREATE TABLE hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rules TEXT,
    start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    max_team_size INT NOT NULL DEFAULT 4,
    min_team_size INT NOT NULL DEFAULT 1,
    require_github BOOLEAN NOT NULL DEFAULT true,
    require_video BOOLEAN NOT NULL DEFAULT false,
    require_app_link BOOLEAN NOT NULL DEFAULT false,
    require_drive_link BOOLEAN NOT NULL DEFAULT false,
    status exam_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hackathon Teams Table
CREATE TABLE hackathon_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hackathon Team Members Table
CREATE TABLE hackathon_team_members (
    team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, candidate_id)
);

-- Hackathon Submissions Table
CREATE TABLE hackathon_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    github_url TEXT,
    video_url TEXT,
    app_url TEXT,
    drive_url TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score NUMERIC,
    feedback TEXT,
    UNIQUE (team_id)
);

-- 4. Create Performance Indexes for Fast Queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_orgs_admin_id ON orgs(admin_id);
CREATE INDEX idx_orgs_invite_code ON orgs(invite_code);
CREATE INDEX idx_org_admins_admin_id ON org_admins(admin_id);
CREATE INDEX idx_enrollments_candidate_id ON enrollments(candidate_id);
CREATE INDEX idx_enrollments_org_id ON enrollments(org_id);
CREATE INDEX idx_exams_org_id ON exams(org_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_candidate_id ON exam_attempts(candidate_id);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_assignments_org_id ON assignments(org_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_candidate_id ON assignment_submissions(candidate_id);
CREATE INDEX idx_contests_org_id ON contests(org_id);
CREATE INDEX idx_problems_contest_id ON problems(contest_id);
CREATE INDEX idx_test_cases_problem_id ON test_cases(problem_id);
CREATE INDEX idx_contest_attempts_contest_id ON contest_attempts(contest_id);
CREATE INDEX idx_contest_attempts_candidate_id ON contest_attempts(candidate_id);
CREATE INDEX idx_violation_events_attempt_id ON violation_events(attempt_id);
CREATE INDEX idx_violation_events_contest_attempt_id ON violation_events(contest_attempt_id);
CREATE INDEX idx_code_submissions_contest_attempts_id ON code_submissions(contest_attempts_id);
CREATE INDEX idx_hackathons_org_id ON hackathons(org_id);
CREATE INDEX idx_hackathon_teams_hackathon_id ON hackathon_teams(hackathon_id);
CREATE INDEX idx_hackathon_teams_invite_code ON hackathon_teams(invite_code);
CREATE INDEX idx_hackathon_team_members_team_id ON hackathon_team_members(team_id);
CREATE INDEX idx_hackathon_team_members_candidate_id ON hackathon_team_members(candidate_id);
CREATE INDEX idx_hackathon_submissions_hackathon_id ON hackathon_submissions(hackathon_id);
CREATE INDEX idx_hackathon_submissions_team_id ON hackathon_submissions(team_id);

-- 5. Enable Row-Level Security on All Tables
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
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;

-- 6. Helper Functions for RLS (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'maintainer'
    UNION
    SELECT 1 FROM orgs WHERE id = check_org_id AND admin_id = auth.uid()
    UNION
    SELECT 1 FROM org_admins WHERE org_id = check_org_id AND admin_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_enrolled(check_org_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'maintainer'
    UNION
    SELECT 1 FROM enrollments WHERE org_id = check_org_id AND candidate_id = auth.uid()
  );
$$;

-- 7. RLS Policies

-- Maintainer full access for ALL tables dynamically
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename NOT IN ('pg_stat_statements', 'pg_stat_statements_info')
    LOOP
        EXECUTE format('CREATE POLICY "Maintainer full access %I" ON %I FOR ALL USING (get_user_role() = ''maintainer'');', t_name, t_name);
    END LOOP;
END
$$;

-- PROFILES
CREATE POLICY "Users select own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin read candidate profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.candidate_id = profiles.id
    AND is_org_admin(enrollments.org_id)
  )
  OR get_user_role() = 'maintainer'
);

-- ORGS
CREATE POLICY "Admin select own orgs" ON orgs FOR SELECT USING (admin_id = auth.uid() OR EXISTS (SELECT 1 FROM org_admins WHERE org_id = id AND admin_id = auth.uid()) OR get_user_role() = 'maintainer');
CREATE POLICY "Admin update own orgs" ON orgs FOR UPDATE USING (admin_id = auth.uid() OR EXISTS (SELECT 1 FROM org_admins WHERE org_id = id AND admin_id = auth.uid()) OR get_user_role() = 'maintainer');
CREATE POLICY "Admin delete own orgs" ON orgs FOR DELETE USING (admin_id = auth.uid() OR EXISTS (SELECT 1 FROM org_admins WHERE org_id = id AND admin_id = auth.uid()) OR get_user_role() = 'maintainer');
CREATE POLICY "Admin insert own orgs" ON orgs FOR INSERT WITH CHECK (admin_id = auth.uid() OR get_user_role() = 'maintainer');
CREATE POLICY "Candidate read orgs" ON orgs FOR SELECT USING (is_enrolled(id));

-- ORG_ADMINS
CREATE POLICY "Admin manage org_admins" ON org_admins FOR ALL USING (is_org_admin(org_id));

-- ENROLLMENTS
CREATE POLICY "Admin manage enrollments" ON enrollments FOR ALL USING (is_org_admin(org_id));
CREATE POLICY "Candidate select own enrollments" ON enrollments FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own enrollments" ON enrollments FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- EXAMS
CREATE POLICY "Admin manage exams" ON exams FOR ALL USING (is_org_admin(org_id));
CREATE POLICY "Candidate read exams" ON exams FOR SELECT USING (is_enrolled(org_id) AND status != 'draft');

-- QUESTIONS
CREATE POLICY "Admin manage questions" ON questions FOR ALL USING (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND is_org_admin(exams.org_id))
);
CREATE POLICY "Candidate read questions" ON questions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM exam_attempts
        WHERE exam_attempts.exam_id = questions.exam_id
        AND exam_attempts.candidate_id = auth.uid()
    )
);

-- EXAM_ATTEMPTS
CREATE POLICY "Admin read exam_attempts" ON exam_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_id AND is_org_admin(exams.org_id))
);
CREATE POLICY "Candidate select own exam_attempts" ON exam_attempts FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own exam_attempts" ON exam_attempts FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- EXAM_ANSWERS
CREATE POLICY "Admin manage exam_answers" ON exam_answers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM exam_attempts
        JOIN exams ON exams.id = exam_attempts.exam_id
        WHERE exam_attempts.id = attempt_id
        AND is_org_admin(exams.org_id)
    )
);
CREATE POLICY "Candidate select own exam_answers" ON exam_answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())
);
CREATE POLICY "Candidate insert own exam_answers" ON exam_answers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = 'in_progress')
);
CREATE POLICY "Candidate update own exam_answers" ON exam_answers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = 'in_progress')
);

-- ASSIGNMENTS
CREATE POLICY "Admin manage assignments" ON assignments FOR ALL USING (is_org_admin(org_id));
CREATE POLICY "Candidate read assignments" ON assignments FOR SELECT USING (is_enrolled(org_id));

-- ASSIGNMENT_SUBMISSIONS
CREATE POLICY "Admin manage assignment_submissions" ON assignment_submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_id AND is_org_admin(assignments.org_id))
);
CREATE POLICY "Candidate select own assignment_submissions" ON assignment_submissions FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own assignment_submissions" ON assignment_submissions FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- CONTESTS
CREATE POLICY "Admin manage contests" ON contests FOR ALL USING (is_org_admin(org_id));
CREATE POLICY "Candidate read contests" ON contests FOR SELECT USING (is_enrolled(org_id) AND status != 'draft');

-- PROBLEMS
CREATE POLICY "Admin manage problems" ON problems FOR ALL USING (
    EXISTS (SELECT 1 FROM contests WHERE contests.id = contest_id AND is_org_admin(contests.org_id))
);
CREATE POLICY "Candidate read problems" ON problems FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM contest_attempts
        WHERE contest_attempts.contest_id = problems.contest_id
        AND contest_attempts.candidate_id = auth.uid()
    )
);

-- TEST_CASES
CREATE POLICY "Admin manage test_cases" ON test_cases FOR ALL USING (
    EXISTS (
        SELECT 1 FROM problems
        JOIN contests ON contests.id = problems.contest_id
        WHERE problems.id = problem_id
        AND is_org_admin(contests.org_id)
    )
);
CREATE POLICY "Candidate read sample test_cases" ON test_cases FOR SELECT USING (
    is_sample = true AND
    EXISTS (
        SELECT 1 FROM problems
        JOIN contest_attempts ON contest_attempts.contest_id = problems.contest_id
        WHERE problems.id = problem_id
        AND contest_attempts.candidate_id = auth.uid()
    )
);

-- CONTEST_ATTEMPTS
CREATE POLICY "Admin read contest_attempts" ON contest_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM contests WHERE contests.id = contest_id AND is_org_admin(contests.org_id))
);
CREATE POLICY "Candidate select own contest_attempts" ON contest_attempts FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidate insert own contest_attempts" ON contest_attempts FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- VIOLATION_EVENTS
CREATE POLICY "Admin read violation_events" ON violation_events FOR SELECT USING (
  (
    attempt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM exam_attempts
      JOIN exams ON exams.id = exam_attempts.exam_id
      WHERE exam_attempts.id = violation_events.attempt_id
      AND is_org_admin(exams.org_id)
    )
  )
  OR
  (
    contest_attempt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM contest_attempts
      JOIN contests ON contests.id = contest_attempts.contest_id
      WHERE contest_attempts.id = violation_events.contest_attempt_id
      AND is_org_admin(contests.org_id)
    )
  )
);
CREATE POLICY "Candidate insert violation_events" ON violation_events FOR INSERT WITH CHECK (
  (attempt_id IS NOT NULL AND EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid()))
  OR
  (contest_attempt_id IS NOT NULL AND EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempt_id AND contest_attempts.candidate_id = auth.uid()))
);

-- CODE_SUBMISSIONS
CREATE POLICY "Admin read code_submissions" ON code_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM contest_attempts
        JOIN contests ON contests.id = contest_attempts.contest_id
        WHERE contest_attempts.id = contest_attempts_id
        AND is_org_admin(contests.org_id)
    )
);
CREATE POLICY "Candidate select own code_submissions" ON code_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())
);
CREATE POLICY "Candidate insert own code_submissions" ON code_submissions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid() AND contest_attempts.status = 'in_progress')
);

-- HACKATHONS
CREATE POLICY "Admin manage hackathons" ON hackathons FOR ALL USING (is_org_admin(org_id));
CREATE POLICY "Candidate read hackathons" ON hackathons FOR SELECT USING (is_enrolled(org_id));

-- HACKATHON_TEAMS
CREATE POLICY "Admin manage hackathon_teams" ON hackathon_teams FOR ALL USING (
    EXISTS (SELECT 1 FROM hackathons WHERE hackathons.id = hackathon_id AND is_org_admin(hackathons.org_id))
);
CREATE POLICY "Candidate select hackathon_teams" ON hackathon_teams FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM hackathons 
        WHERE hackathons.id = hackathon_teams.hackathon_id 
        AND is_enrolled(hackathons.org_id)
    )
);
CREATE POLICY "Candidate insert hackathon_teams" ON hackathon_teams FOR INSERT WITH CHECK (
    leader_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM hackathons 
        WHERE hackathons.id = hackathon_teams.hackathon_id 
        AND is_enrolled(hackathons.org_id)
    )
);
CREATE POLICY "Candidate update own hackathon_teams" ON hackathon_teams FOR UPDATE USING (leader_id = auth.uid());
CREATE POLICY "Candidate delete own hackathon_teams" ON hackathon_teams FOR DELETE USING (leader_id = auth.uid());

-- HACKATHON_TEAM_MEMBERS
CREATE POLICY "Admin manage hackathon_team_members" ON hackathon_team_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM hackathon_teams
        JOIN hackathons ON hackathons.id = hackathon_teams.hackathon_id
        WHERE hackathon_teams.id = team_id
        AND is_org_admin(hackathons.org_id)
    )
);
CREATE POLICY "Candidate select hackathon_team_members" ON hackathon_team_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM hackathon_teams
        JOIN hackathons ON hackathons.id = hackathon_teams.hackathon_id
        WHERE hackathon_teams.id = team_id
        AND is_enrolled(hackathons.org_id)
    )
);
CREATE POLICY "Candidate insert hackathon_team_members" ON hackathon_team_members FOR INSERT WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "Candidate delete own hackathon_team_members" ON hackathon_team_members FOR DELETE USING (candidate_id = auth.uid());

-- HACKATHON_SUBMISSIONS
CREATE POLICY "Admin manage hackathon_submissions" ON hackathon_submissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM hackathons 
        WHERE hackathons.id = hackathon_submissions.hackathon_id 
        AND is_org_admin(hackathons.org_id)
    )
);
CREATE POLICY "Candidate select hackathon_submissions" ON hackathon_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM hackathons 
        WHERE hackathons.id = hackathon_submissions.hackathon_id 
        AND is_enrolled(hackathons.org_id)
    )
);
CREATE POLICY "Candidate insert hackathon_submissions" ON hackathon_submissions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM hackathon_teams 
        WHERE hackathon_teams.id = hackathon_submissions.team_id 
        AND hackathon_teams.leader_id = auth.uid()
    )
);
CREATE POLICY "Candidate update own hackathon_submissions" ON hackathon_submissions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM hackathon_teams 
        WHERE hackathon_teams.id = hackathon_submissions.team_id 
        AND hackathon_teams.leader_id = auth.uid()
    )
);

-- 8. Default Schema Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 9. Storage Buckets & Policies

-- Bucket: assignment-submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Assignment Files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Assignment Files" ON storage.objects;

CREATE POLICY "Users can list their own assignment files" ON storage.objects
FOR SELECT
USING (bucket_id = 'assignment-submissions' AND auth.uid() = owner);

CREATE POLICY "Authenticated Upload Assignment Files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions'
  AND auth.role() = 'authenticated'
);

-- Bucket: exam-uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-uploads', 'exam-uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Exam Files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Exam Files" ON storage.objects;

CREATE POLICY "Users can list their own exam files" ON storage.objects
FOR SELECT USING (bucket_id = 'exam-uploads' AND auth.uid() = owner);

CREATE POLICY "Authenticated Upload Exam Files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'exam-uploads'
  AND auth.role() = 'authenticated'
);


