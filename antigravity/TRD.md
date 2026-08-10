# Flint — Technical Requirements Document

Companion to PRD.md. This is the build spec — an AI IDE or engineer should be able to work bottom-up from this document alone.

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js (App Router) — deployed on Vercel                  │
│  - Candidate UI, Admin UI, Maintainer UI (role-gated routes) │
│  - API routes / Server Actions (short-lived, <60s)           │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
   ┌─────────────────────────┐     ┌───────────────────────────┐
   │ Supabase                │     │ Code Execution Service      │
   │  - Postgres (data)      │     │  (Judge0, self/community-   │
   │  - Auth (candidates,    │     │   hosted, called via HTTP)  │
   │    admins, maintainer)  │     │  - Isolated sandbox, NOT    │
   │  - Row-Level Security   │     │    run inside Vercel        │
   │    (hierarchy + isolation)   │  functions                  │
   │  - Realtime (Broadcast) │     └───────────────────────────┘
   │  - Storage (uploads)    │
   └─────────────────────────┘
```

**Why code execution is a separate service:** running untrusted candidate code needs a real sandbox (CPU/memory/time limits, no network access) — this cannot safely run inside a Vercel serverless function. Judge0 (open source, MIT-ish) is the standard free/self-hostable answer; call it over HTTP as a black box. This keeps the core app 100% serverless while isolating the one component that genuinely needs a persistent sandboxed runtime.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 14+ (App Router), TypeScript | Serverless-native on Vercel, one language across front/back |
| Hosting | Vercel | Zero-ops deploy, free tier sufficient for pilot |
| Database | Supabase Postgres | Relational integrity for hierarchical data, RLS for tenant isolation |
| Auth | Supabase Auth | Built-in, integrates directly with RLS via `auth.uid()` |
| Realtime | Supabase Realtime (Broadcast channels) | Timers, live leaderboards, admin live-monitoring — no separate service needed |
| File storage | Supabase Storage | Assignment uploads, kept simple, same vendor |
| Code execution | Judge0 (self-hosted via Docker, or hosted community instance) | Only proven free/open option for sandboxed multi-language execution |
| Styling | Tailwind CSS | Fast to build, consistent with AI-IDE codegen patterns |
| Validation | Zod | Shared schema validation client + server |

---

## 3. Data model

Core tables (Postgres, all under RLS). `org` = one admin's independent teaching/event space.

```sql
-- Identity & hierarchy
profiles          (id uuid pk -> auth.users, role enum['maintainer','admin','candidate'], name, email, created_at)
orgs              (id pk, admin_id -> profiles.id, name, created_at)               -- one admin owns one or more orgs (classes/events)
enrollments       (id pk, org_id -> orgs.id, candidate_id -> profiles.id, joined_at, unique(org_id, candidate_id))

-- MCQ Exams
exams             (id pk, org_id -> orgs.id, title, duration_minutes, start_at, end_at, negative_marking bool, randomize bool, status enum['draft','live','closed'])
questions         (id pk, exam_id -> exams.id, text, type enum['single','multi'], options jsonb, correct_options jsonb, marks numeric)
exam_attempts     (id pk, exam_id -> exams.id, candidate_id -> profiles.id, started_at, submitted_at, score numeric, violation_score numeric, status enum['in_progress','submitted','auto_submitted'])
exam_answers      (id pk, attempt_id -> exam_attempts.id, question_id -> questions.id, selected_options jsonb)
violation_events  (id pk, attempt_id -> exam_attempts.id, type enum['tab_switch','fullscreen_exit','blur','multi_session','devtools'], occurred_at, meta jsonb)

-- Assignments
assignments             (id pk, org_id -> orgs.id, title, instructions, due_at, max_score numeric)
assignment_submissions  (id pk, assignment_id -> assignments.id, candidate_id -> profiles.id, file_url, link_url, submitted_at, is_late bool, score numeric, feedback text, version int)

-- Contests / coding rounds
contests          (id pk, org_id -> orgs.id, title, start_at, end_at, duration_minutes, status enum['draft','live','closed'])
problems          (id pk, contest_id -> contests.id, title, statement, starter_code jsonb, languages jsonb)
test_cases        (id pk, problem_id -> problems.id, input text, expected_output text, is_sample bool, weight numeric)
contest_attempts  (id pk, contest_id -> contests.id, candidate_id -> profiles.id, started_at, submitted_at, status)
code_submissions  (id pk, contest_attempts_id -> contest_attempts.id, problem_id -> problems.id, language, source_code text, submitted_at, passed_count int, total_count int, score numeric, judge_raw jsonb)
```

**Hierarchy enforcement:** every row that belongs to an org carries `org_id`. RLS policies check:
- `maintainer` → full access, all tables.
- `admin` → row-level access only where `orgs.admin_id = auth.uid()`.
- `candidate` → access only their own `profiles.id` rows, and only exam/contest/assignment content where they hold an `enrollments` row for that `org_id`, and only while the item's status is `live` (or read-only after close).

This is the actual mechanism behind "many admins can conduct many things for their own class" — it's enforced by Postgres, not by application code, so a bug in the UI can't leak another admin's data.

---

## 4. Auth & permission model

- Supabase Auth handles login (email/password or magic link to start; SSO later if the college wants it).
- `profiles.role` set at signup — candidates self-register or are invited via org invite code; admins are created by a maintainer; maintainer accounts are seeded manually, not self-serve.
- Every RLS policy keys off `auth.uid()` joined against `profiles.role` and `orgs.admin_id` / `enrollments.candidate_id` — never trust a role claim from the client.

---

## 5. Realtime usage (Supabase Broadcast, not Postgres Changes)

Use **Broadcast channels**, not raw `postgres_changes` subscriptions — broadcast doesn't re-run RLS per row per subscriber, which matters once a session has 100+ concurrent candidates.

| Channel | Purpose | Who subscribes |
|---|---|---|
| `exam:{exam_id}` | Server-authoritative countdown ticks, forced-submit signal at time-up | All candidates in that exam |
| `contest:{contest_id}:leaderboard` | Live rank updates on score change | All candidates + admin in that contest |
| `org:{org_id}:monitor` | Live violation-event feed | Admin dashboard only |

Server-side timer is the source of truth: store `started_at` + `duration_minutes` in `exam_attempts`; a scheduled check (Vercel Cron or Supabase Edge Function) force-submits any attempt past its deadline, independent of whether the candidate's browser is even open.

---

## 6. Code execution integration (contests)

1. Candidate submits code → Next.js API route validates ownership/attempt window, then POSTs source + language + test cases to Judge0.
2. Judge0 runs in isolated containers, returns stdout/stderr/exit-code/time per test case.
3. API route computes `passed_count`/`score`, writes to `code_submissions`, and publishes an update on the `contest:{id}:leaderboard` broadcast channel.
4. Never expose hidden test case inputs/outputs to the client — only pass/fail counts and sample-case results.

Phase 1 language support: start with Python + JavaScript (simplest sandboxes), add C++/Java once the pipeline is proven.

---

## 7. Anti-cheat event spec (Phase 1 — no camera)

Client-side listeners during any live `exam_attempt` or `contest_attempt`:

| Event | Trigger | Weight (default, tunable per exam) |
|---|---|---|
| `tab_switch` | `visibilitychange` → hidden | 2 |
| `blur` | `window.blur` | 1 |
| `fullscreen_exit` | `fullscreenchange` → not fullscreen | 3 |
| `devtools` | devtools-open heuristic (window size delta) | 3 |
| `multi_session` | second active session detected for same attempt (via a heartbeat + single-active-token check) | 5 (also can force-lock the earlier session) |
| `copy_paste_blocked` | blocked `copy`/`paste` event on question area | 1 |

`violation_score` = weighted sum, computed server-side on each event insert (never trust a client-computed total). Displayed next to the score, never used to auto-disqualify in Phase 1 — always a human-in-the-loop signal for the admin.

---

## 8. API surface (high-level; Next.js route handlers / Server Actions)

```
/api/auth/*                         Supabase-managed
/api/orgs                           CRUD (admin, maintainer)
/api/orgs/:id/enroll                candidate join via invite code

/api/exams                          CRUD (admin)
/api/exams/:id/start                candidate: create exam_attempt, returns server start time
/api/exams/:id/answer               candidate: upsert exam_answers
/api/exams/:id/submit               candidate or server-cron: finalize attempt, compute score
/api/exams/:id/violations           candidate: log a violation_event (rate-limited)

/api/assignments                    CRUD (admin)
/api/assignments/:id/submit         candidate: upload + create submission version
/api/assignments/:id/grade          admin: score + feedback

/api/contests                       CRUD (admin)
/api/contests/:id/problems          CRUD (admin)
/api/contests/:id/run               candidate: run against sample cases (no persistence)
/api/contests/:id/submit            candidate: run against full set via Judge0, persist result

/api/maintainer/*                   cross-org read/override endpoints, maintainer-only RLS bypass via service role
```

---

## 9. Scalability & free-tier notes

- **Realtime connection budget is the tightest constraint.** Supabase free tier: ~200 peak concurrent connections. Multiplex all of a candidate's realtime needs onto **one channel per active session**, not one per feature, to stretch this.
- **Vercel function timeout (60s on free tier)** — code execution must be async-polled (submit → poll/webhook from Judge0), never a single blocking 60s+ request.
- Server-authoritative timers via a scheduled job, not per-request client polling, to keep function invocation counts low.
- Design every table with `org_id` from day one — retrofitting multi-tenancy later is the most expensive mistake to leave for Phase 2.

---

## 10. Build order (bottom-up, for an AI IDE)

1. Supabase project + full schema (section 3) + RLS policies (section 3/4) — get this right before any UI.
2. Auth flows: signup/login, role assignment, org creation, invite-code enrollment.
3. Maintainer read-only cross-org dashboard (proves RLS bypass works safely via service role, isolated from candidate/admin paths).
4. Assignments module first (simplest — no timer, no realtime, no sandbox) to prove the org-isolation pattern end to end.
5. MCQ exam module: question bank CRUD → attempt flow → server-side timer/cron → violation event logging → realtime countdown.
6. Contest module last (most moving parts): problem/test-case CRUD → Judge0 integration → submission pipeline → live leaderboard.
7. Polish: admin dashboards (results, violation review, shortlist export as CSV).
