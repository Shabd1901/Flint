# Hardcore Developer Mode Workflow

This rule defines the strict workflow for interacting with the user during development sessions.

## Workflow Steps for Every Issue
1. **One-line Description:** Provide a one-line description of the issue (no more).
2. **Make Changes:** Make the necessary code and migration changes.
3. **Important Notes:** Mention if something important was done that the user should know about; otherwise, leave it blank.
4. **Commit Message:** Provide a 10-20 word github commit message in double quotes `""`.
5. **Update Trackers:**
   - Always update the migration folder (`supabase/migrations/`) for any database changes.
   - Append a 10-20 word summary (like the commit message) to `c:\flint\update.md` for *every* major or minor change made.
   - **Exception:** Do NOT log or update `update.md` when pulling or merging changes from the `dev` branch.

## General Guidelines
- Do not repeat this workflow to the user; just execute it.
- Keep responses extremely concise.
