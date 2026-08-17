-- Drop the NOT NULL constraint on admin_id so Maintainers can unlink admins from organizations
ALTER TABLE orgs ALTER COLUMN admin_id DROP NOT NULL;
