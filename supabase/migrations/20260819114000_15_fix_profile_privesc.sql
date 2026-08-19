-- 1. Restrict Users from Modifying Their Own Profiles
DROP POLICY IF EXISTS "Users access own profile" ON profiles;

-- Only allow users to read their own profile
CREATE POLICY "Users select own profile" ON profiles FOR SELECT USING (id = auth.uid());

-- NOTE: All profile inserts/updates are currently handled by server actions
-- using the Service Role key (which bypasses RLS), so clients do not need
-- INSERT, UPDATE, or DELETE permissions on their own profiles.
