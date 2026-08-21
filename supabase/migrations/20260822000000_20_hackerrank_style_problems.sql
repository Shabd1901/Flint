-- Rebuild problems table for Hackerrank style
ALTER TABLE problems
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS input_format TEXT,
ADD COLUMN IF NOT EXISTS output_format TEXT,
ADD COLUMN IF NOT EXISTS constraints TEXT;

-- Move existing data if any (fallback)
UPDATE problems SET description = statement WHERE description IS NULL;

-- Make description required (optional depending on how strict we want to be, we can just leave it as text for now)
