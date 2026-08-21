-- Migration: Add Hackathons Module
-- Includes hackathons, hackathon_teams, hackathon_team_members, hackathon_submissions

-- 1. Create Tables
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

CREATE TABLE hackathon_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hackathon_team_members (
    team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, candidate_id)
);

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

-- 2. Indexes
CREATE INDEX idx_hackathons_org_id ON hackathons(org_id);
CREATE INDEX idx_hackathon_teams_hackathon_id ON hackathon_teams(hackathon_id);
CREATE INDEX idx_hackathon_teams_invite_code ON hackathon_teams(invite_code);
CREATE INDEX idx_hackathon_team_members_team_id ON hackathon_team_members(team_id);
CREATE INDEX idx_hackathon_team_members_candidate_id ON hackathon_team_members(candidate_id);
CREATE INDEX idx_hackathon_submissions_hackathon_id ON hackathon_submissions(hackathon_id);
CREATE INDEX idx_hackathon_submissions_team_id ON hackathon_submissions(team_id);

-- 3. Enable RLS
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Maintainer full access for ALL tables dynamically
CREATE POLICY "Maintainer full access hackathons" ON hackathons FOR ALL USING (get_user_role() = 'maintainer');
CREATE POLICY "Maintainer full access hackathon_teams" ON hackathon_teams FOR ALL USING (get_user_role() = 'maintainer');
CREATE POLICY "Maintainer full access hackathon_team_members" ON hackathon_team_members FOR ALL USING (get_user_role() = 'maintainer');
CREATE POLICY "Maintainer full access hackathon_submissions" ON hackathon_submissions FOR ALL USING (get_user_role() = 'maintainer');

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

-- Default Schema Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON hackathons TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hackathon_teams TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hackathon_team_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hackathon_submissions TO anon, authenticated;
