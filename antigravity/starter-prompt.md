# Starter prompt — paste into your AI IDE (Claude Code / Cursor)

Attach `PRD.md` and `TRD.md` alongside this prompt if your IDE supports file context. Otherwise paste their content above this prompt.

---

You are building **Flint**, a hierarchical exam/contest/assignment platform for PS-01 ("secure, proctored examination tool to screen and shortlist candidates for hackathons"). Full spec is in the attached PRD.md and TRD.md — follow them exactly, don't invent scope beyond them.

## Non-negotiable constraints

- **Phase 1 has no camera, no eye tracking, no computer vision of any kind.** Integrity is event-based only (tab switch, blur, fullscreen exit, devtools, multi-session, copy/paste) — see TRD section 7. Do not add webcam code "for later" — leave it out entirely.
- **Multi-tenancy is enforced at the database level via Postgres Row-Level Security, not in application code.** Every table that belongs to an org must carry `org_id`, and every query path must be provably impossible to leak across orgs even if the frontend has a bug. Write RLS policy tests before writing UI.
- **Three roles**: `maintainer` (cross-org override), `admin` (owns one or more orgs/classes), `candidate` (enrolled under orgs via `enrollments`). Roles live in `profiles.role` and are never trusted from client input.
- **Server-authoritative timing everywhere.** Exam/contest attempts store `started_at` + `duration_minutes` in the DB; a scheduled job (Vercel Cron or Supabase Edge Function) force-submits expired attempts. Never trust a client-reported "time's up."
- **Code execution is fully isolated from the core app.** Untrusted candidate code goes to Judge0 over HTTP as a black box — never execute candidate code inside a Next.js function.

## Stack (do not substitute without asking)

- Next.js 14+, App Router, TypeScript
- Tailwind CSS
- Supabase: Postgres + Auth + Realtime (Broadcast channels, not raw `postgres_changes`) + Storage
- Judge0 for sandboxed code execution (assume a hosted/self-hosted instance URL will be provided via env var)
- Zod for shared validation schemas
- Deploy target: Vercel

## Build order — go bottom-up, in this exact sequence, and don't skip ahead to UI before a layer is solid

1. **Schema + RLS.** Implement every table from TRD section 3 as Supabase migrations. Write RLS policies per TRD section 3/4. Write a small test script (can be a seed + a set of assertions run via the Supabase client with different mock JWTs) proving: an admin cannot read another admin's org data, a candidate cannot read another candidate's attempts, and a maintainer can read everything.
2. **Auth flows.** Signup/login via Supabase Auth. Admin accounts created by maintainer only (no self-serve admin signup). Candidates self-register or join via org invite code. Role-gated route groups: `/maintainer/*`, `/admin/*`, `/candidate/*`.
3. **Maintainer read-only dashboard.** Cross-org view using the Supabase service role (bypasses RLS deliberately, isolated to maintainer-only server routes). This proves the escape hatch works safely before building anything else on top of it.
4. **Assignments module first** — simplest module (no timer, no realtime, no sandbox), proves the org-isolation pattern end to end for CRUD + file upload (Supabase Storage) + grading.
5. **MCQ exam module.** Question bank CRUD → attempt flow (`/api/exams/:id/start`, `/answer`, `/submit`) → server-side timer enforcement via scheduled job → violation event logging (rate-limited, server-computed weight) → realtime countdown via a single Broadcast channel per exam session.
6. **Contest module last.** Problem/test-case CRUD → Judge0 integration (`run` for sample cases, `submit` for full hidden-case scoring, async-polled, never a blocking 60s+ request) → live leaderboard on a `contest:{id}:leaderboard` Broadcast channel.
7. **Polish.** Admin dashboards: ranked results next to violation scores (never auto-hide/auto-disqualify — always human-in-the-loop), CSV shortlist export.

## What "done" looks like for each layer before moving to the next

- Schema/RLS: automated proof of isolation, not just "looks right in the Supabase dashboard."
- Auth: all three roles can log in and land on the correct route group; wrong-role access attempts are blocked server-side, not just hidden in the UI.
- Each module: works end-to-end for one admin + one candidate locally before you add the second admin to prove isolation holds under real data.

## Style/scope guardrails

- No feature not listed in PRD.md section 6. If something feels missing (plagiarism detection, camera proctoring, billing), it's explicitly Phase 2+ — see PRD section 8. Flag it, don't build it.
- Keep API routes short-lived — anything that could run long (code execution, bulk grading) must be async/polled, not a single blocking request, because of the Vercel function timeout.
- Every new table needs `org_id` from the start, even if a feature seems single-tenant at first glance.

Start with step 1 (schema + RLS) and show me the migration files and the isolation test results before writing any UI.
