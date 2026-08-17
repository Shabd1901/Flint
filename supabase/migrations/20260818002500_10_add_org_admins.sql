-- 1. Create junction table for organization co-admins
CREATE TABLE IF NOT EXISTS org_admins (
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (org_id, admin_id)
);

-- 2. Enable RLS
ALTER TABLE org_admins ENABLE ROW LEVEL SECURITY;

-- 3. Update the is_org_admin function to include co-admins
-- (SECURITY DEFINER allows it to bypass RLS, avoiding infinite recursion)
CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orgs WHERE id = check_org_id AND admin_id = auth.uid()
    UNION
    SELECT 1 FROM org_admins WHERE org_id = check_org_id AND admin_id = auth.uid()
  );
$$;

-- 4. RLS Policies for org_admins
CREATE POLICY "Admins can view their org admins" ON org_admins 
FOR SELECT USING (is_org_admin(org_id) OR get_user_role() = 'maintainer');

CREATE POLICY "Admins can insert org admins" ON org_admins
FOR INSERT WITH CHECK (is_org_admin(org_id) OR get_user_role() = 'maintainer');

CREATE POLICY "Admins can delete org admins" ON org_admins
FOR DELETE USING (is_org_admin(org_id) OR get_user_role() = 'maintainer');

-- 5. Update orgs table RLS to use the new is_org_admin function so co-admins can access the org record
DROP POLICY IF EXISTS "Admin access own orgs" ON orgs;
CREATE POLICY "Admin access own orgs" ON orgs FOR ALL USING (is_org_admin(id) OR get_user_role() = 'maintainer');
