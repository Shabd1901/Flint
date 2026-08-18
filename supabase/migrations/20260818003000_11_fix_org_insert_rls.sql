-- Fix the RLS policy for inserting organizations
-- The previous policy used a function that queried the table, which fails during INSERT because the row isn't visible yet.

DROP POLICY IF EXISTS "Admin access own orgs" ON orgs;

CREATE POLICY "Admin select own orgs" ON orgs FOR SELECT USING (is_org_admin(id) OR get_user_role() = 'maintainer');
CREATE POLICY "Admin update own orgs" ON orgs FOR UPDATE USING (is_org_admin(id) OR get_user_role() = 'maintainer');
CREATE POLICY "Admin delete own orgs" ON orgs FOR DELETE USING (is_org_admin(id) OR get_user_role() = 'maintainer');
CREATE POLICY "Admin insert own orgs" ON orgs FOR INSERT WITH CHECK (admin_id = auth.uid() OR get_user_role() = 'maintainer');
